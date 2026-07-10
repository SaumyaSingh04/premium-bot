import prisma from '../../config/prisma.js';

class PgWalletRepository {
  findByUserId(userId) {
    return prisma.wallet.findUnique({ where: { userId } });
  }

  findByUserIdWithTransactions(userId, txLimit = 20) {
    return prisma.wallet.findUnique({
      where: { userId },
      include: {
        coinTransactions: {
          orderBy: { createdAt: 'desc' },
          take: txLimit,
        },
      },
    });
  }

  create(userId) {
    return prisma.wallet.create({ data: { userId, balance: 0 } });
  }

  /**
   * Atomically increment wallet balance.
   * Use inside a Prisma transaction when pairing with a CoinTransaction record.
   */
  incrementBalance(userId, amount, tx = prisma) {
    return tx.wallet.update({
      where: { userId },
      data: { balance: { increment: amount } },
    });
  }

  /**
   * Atomically decrement balance — caller must verify balance >= amount first
   * or use a transaction with a conditional check.
   */
  decrementBalance(userId, amount, tx = prisma) {
    return tx.wallet.update({
      where: { userId },
      data: { balance: { decrement: amount } },
    });
  }

  setBalance(userId, balance, tx = prisma) {
    return tx.wallet.update({
      where: { userId },
      data: { balance },
    });
  }

  delete(userId) {
    return prisma.wallet.delete({ where: { userId } });
  }
}

export default new PgWalletRepository();
