import prisma from '../../config/prisma.js';

class PgUserRepository {
  findById(id) {
    return prisma.user.findUnique({ where: { id }, include: { wallet: true } });
  }

  findByTelegramId(telegramId) {
    return prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
      include: { wallet: true },
    });
  }

  /**
   * Upsert user + create wallet in a single transaction.
   * Safe to call on every /start — idempotent.
   */
  async findOrCreate(telegramId, data) {
    const tid = BigInt(telegramId);

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { telegramId: tid },
        create: { telegramId: tid, ...data },
        update: {
          username: data.username,
          firstName: data.firstName,
          lastName: data.lastName,
          lastActiveAt: new Date(),
        },
        include: { wallet: true },
      });

      if (!user.wallet) {
        await tx.wallet.create({ data: { userId: user.id, balance: 0 } });
        return tx.user.findUnique({
          where: { id: user.id },
          include: { wallet: true },
        });
      }

      return user;
    });
  }

  update(telegramId, data) {
    return prisma.user.update({
      where: { telegramId: BigInt(telegramId) },
      data,
      include: { wallet: true },
    });
  }

  updateSettings(telegramId, { aiModel, temperature, maxTokens }) {
    return prisma.user.update({
      where: { telegramId: BigInt(telegramId) },
      data: { aiModel, temperature, maxTokens },
    });
  }

  incrementStats(telegramId, tokensUsed = 0) {
    return prisma.user.update({
      where: { telegramId: BigInt(telegramId) },
      data: {
        totalMessages: { increment: 1 },
        totalTokens: { increment: tokensUsed },
        lastActiveAt: new Date(),
      },
    });
  }

  resetStats(telegramId) {
    return prisma.user.update({
      where: { telegramId: BigInt(telegramId) },
      data: { totalMessages: 0, totalTokens: 0 },
    });
  }

  setLastFreeGenerationAt(id, date = new Date()) {
    return prisma.user.update({
      where: { id },
      data: { lastFreeGenerationAt: date },
    });
  }

  findAllTelegramIds() {
    return prisma.user.findMany({ select: { telegramId: true } }).then((rows) => rows.map((r) => r.telegramId));
  }

  delete(telegramId) {
    return prisma.user.delete({ where: { telegramId: BigInt(telegramId) } });
  }

  count() {
    return prisma.user.count();
  }

  globalStats() {
    return prisma.user.aggregate({
      _sum: { totalMessages: true, totalTokens: true },
    });
  }
}

export default new PgUserRepository();
