import prisma from '../../config/prisma.js';

class PgCoinPlanRepository {
  findAll(onlyActive = true) {
    return prisma.coinPlan.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: { sortOrder: 'asc' },
    });
  }

  findById(id) {
    return prisma.coinPlan.findUnique({ where: { id } });
  }

  findByStripePriceId(stripePriceId) {
    return prisma.coinPlan.findFirst({ where: { stripePriceId } });
  }

  create(data) {
    return prisma.coinPlan.create({ data });
  }

  update(id, data) {
    return prisma.coinPlan.update({ where: { id }, data });
  }

  setActive(id, isActive) {
    return prisma.coinPlan.update({ where: { id }, data: { isActive } });
  }

  delete(id) {
    return prisma.coinPlan.delete({ where: { id } });
  }
}

export default new PgCoinPlanRepository();
