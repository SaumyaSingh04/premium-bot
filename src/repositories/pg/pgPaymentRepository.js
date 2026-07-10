import prisma from '../../config/prisma.js';

class PgPaymentRepository {
  findById(id) {
    return prisma.payment.findUnique({
      where: { id },
      include: { plan: true },
    });
  }

  findByExternalId(externalId) {
    return prisma.payment.findFirst({ where: { externalId } });
  }

  findByUserId(userId, limit = 20, offset = 0) {
    return prisma.payment.findMany({
      where: { userId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  findPendingByUserId(userId) {
    return prisma.payment.findMany({
      where: { userId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * @param {object} data
   * @param {number} data.userId
   * @param {number} data.planId
   * @param {import('@prisma/client').PaymentProvider} data.provider
   * @param {number} data.amountUsd
   * @param {number} data.coins
   * @param {string} [data.externalId]
   * @param {string} [data.checkoutUrl]
   */
  create(data) {
    return prisma.payment.create({ data });
  }

  update(id, data) {
    return prisma.payment.update({ where: { id }, data });
  }

  markCompleted(id, externalId) {
    return prisma.payment.update({
      where: { id },
      data: { status: 'COMPLETED', externalId, completedAt: new Date() },
    });
  }

  markFailed(id) {
    return prisma.payment.update({
      where: { id },
      data: { status: 'FAILED' },
    });
  }

  markRefunded(id) {
    return prisma.payment.update({
      where: { id },
      data: { status: 'REFUNDED' },
    });
  }

  saveWebhookPayload(id, webhookPayload) {
    return prisma.payment.update({
      where: { id },
      data: { webhookPayload },
    });
  }

  countByStatus(status) {
    return prisma.payment.count({ where: { status } });
  }

  sumCompletedByUserId(userId) {
    return prisma.payment.aggregate({
      where: { userId, status: 'COMPLETED' },
      _sum: { amountUsd: true, coins: true },
    });
  }
}

export default new PgPaymentRepository();
