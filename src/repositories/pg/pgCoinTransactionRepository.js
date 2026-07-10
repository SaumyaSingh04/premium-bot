import prisma from '../../config/prisma.js';

class PgCoinTransactionRepository {
  findById(id) {
    return prisma.coinTransaction.findUnique({ where: { id } });
  }

  findByUserId(userId, limit = 20, offset = 0) {
    return prisma.coinTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  findByWalletId(walletId, limit = 20) {
    return prisma.coinTransaction.findMany({
      where: { walletId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Create a transaction record.
   * Always call inside a prisma.$transaction() alongside the wallet balance update.
   * @param {object} data
   * @param {number} data.userId
   * @param {number} data.walletId
   * @param {import('@prisma/client').CoinTxType} data.type
   * @param {number} data.amount        positive = credit, negative = debit
   * @param {number} data.balanceAfter  wallet balance snapshot after this tx
   * @param {string} [data.note]
   * @param {string} [data.refId]
   * @param {object} [tx]               Prisma transaction client
   */
  create(data, tx = prisma) {
    return tx.coinTransaction.create({ data });
  }

  sumByUserAndType(userId, type) {
    return prisma.coinTransaction.aggregate({
      where: { userId, type },
      _sum: { amount: true },
    });
  }

  countByUserId(userId) {
    return prisma.coinTransaction.count({ where: { userId } });
  }
}

export default new PgCoinTransactionRepository();
