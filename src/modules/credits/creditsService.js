import creditsRepository from '../../repositories/creditsRepository.js';
import userService from '../user/userService.js';

class CreditsService {
  getCredits(telegramId) {
    return creditsRepository.getCredits(telegramId);
  }

  async deductAndCheck(telegramId, fromCtx) {
    await userService.registerFromTelegram({
      id: telegramId,
      username: fromCtx.username,
      first_name: fromCtx.first_name,
      last_name: fromCtx.last_name,
    });

    return creditsRepository.deduct(telegramId);
  }

  deduct(telegramId, amount = 1) {
    return creditsRepository.deduct(telegramId, amount);
  }
}

export default new CreditsService();
