import prisma from '../../config/prisma.js';

class PgGenerationHistoryRepository {
  findById(id) {
    return prisma.generationHistory.findUnique({ where: { id } });
  }

  findByUserId(userId, limit = 20, offset = 0) {
    return prisma.generationHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  findByUserIdAndType(userId, type, limit = 10) {
    return prisma.generationHistory.findMany({
      where: { userId, type },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * @param {object} data
   * @param {number} data.userId
   * @param {import('@prisma/client').GenerationType} data.type
   * @param {import('@prisma/client').GenerationStatus} [data.status]
   * @param {string} [data.prompt]
   * @param {string} [data.response]
   * @param {string} [data.model]
   * @param {number} [data.tokensUsed]
   * @param {string} [data.provider]
   * @param {string} [data.mediaUrl]
   * @param {number} [data.coinsSpent]
   * @param {string} [data.error]
   */
  create(data) {
    return prisma.generationHistory.create({ data });
  }

  update(id, data) {
    return prisma.generationHistory.update({ where: { id }, data });
  }

  markSuccess(id, data) {
    return prisma.generationHistory.update({
      where: { id },
      data: { status: 'SUCCESS', ...data },
    });
  }

  markFailed(id, error) {
    return prisma.generationHistory.update({
      where: { id },
      data: { status: 'FAILED', error },
    });
  }

  delete(id) {
    return prisma.generationHistory.delete({ where: { id } });
  }

  deleteByUserId(userId) {
    return prisma.generationHistory.deleteMany({ where: { userId } });
  }

  countByUserId(userId) {
    return prisma.generationHistory.count({ where: { userId } });
  }

  sumCoinsSpentByUserId(userId) {
    return prisma.generationHistory.aggregate({
      where: { userId },
      _sum: { coinsSpent: true },
    });
  }
}

export default new PgGenerationHistoryRepository();
