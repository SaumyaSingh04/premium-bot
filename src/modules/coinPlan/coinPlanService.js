import coinPlanRepository from '../../repositories/pg/pgCoinPlanRepository.js';

class CoinPlanService {
  getPlans(onlyActive = true) {
    return coinPlanRepository.findAll(onlyActive);
  }

  getPlanById(id) {
    return coinPlanRepository.findById(id);
  }

  createPlan(data) {
    return coinPlanRepository.create(data);
  }

  updatePlan(id, data) {
    return coinPlanRepository.update(id, data);
  }

  setPlanActive(id, isActive) {
    return coinPlanRepository.setActive(id, isActive);
  }
}

export default new CoinPlanService();
