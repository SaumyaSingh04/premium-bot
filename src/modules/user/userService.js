import pgUserRepository from '../../repositories/pg/pgUserRepository.js';
import logger from '../../logger/index.js';

class UserService {
  /**
   * Called on every /start.
   * Upserts the user row and creates a Wallet if one doesn't exist yet.
   * Returns the full user record including wallet.
   *
   * @param {object} from  ctx.from from Telegraf
   * @returns {Promise<import('@prisma/client').User & { wallet: import('@prisma/client').Wallet }>}
   */
  async registerFromTelegram(from) {
    const user = await pgUserRepository.findOrCreate(from.id, {
      username: from.username ?? null,
      firstName: from.first_name ?? null,
      lastName: from.last_name ?? null,
    });

    logger.info('User registered/updated', {
      telegramId: from.id,
      username: from.username,
      isNew: !user.totalMessages,
    });

    return user;
  }

  findByTelegramId(telegramId) {
    return pgUserRepository.findByTelegramId(telegramId);
  }

  findById(id) {
    return pgUserRepository.findById(id);
  }

  update(telegramId, data) {
    return pgUserRepository.update(telegramId, data);
  }

  updateSettings(telegramId, settings) {
    return pgUserRepository.updateSettings(telegramId, settings);
  }

  incrementStats(telegramId, tokensUsed = 0) {
    return pgUserRepository.incrementStats(telegramId, tokensUsed);
  }

  resetStats(telegramId) {
    return pgUserRepository.resetStats(telegramId);
  }

  setLastFreeGenerationAt(id, date) {
    return pgUserRepository.setLastFreeGenerationAt(id, date);
  }

  delete(telegramId) {
    return pgUserRepository.delete(telegramId);
  }

  count() {
    return pgUserRepository.count();
  }

  globalStats() {
    return pgUserRepository.globalStats();
  }
}

export default new UserService();
