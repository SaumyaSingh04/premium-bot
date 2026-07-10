import walletService from '../wallet/walletService.js';
import userService from '../user/userService.js';
import pgGenerationHistoryRepository from '../../repositories/pg/pgGenerationHistoryRepository.js';
import huggingFaceProvider from '../../providers/huggingface.js';
import falAiProvider from '../../providers/falai.js';
import { GENERATION_COSTS } from './generationCosts.js';
import { GenerationError, GENERATION_ERRORS } from './generationError.js';
import logger from '../../logger/index.js';
import axios from 'axios';

class GenerationService {
  /**
   * Generate an image from a text prompt.
   * @param {number} telegramId
   * @param {string} prompt
   * @returns {Promise<{ buffer: Buffer, coinsSpent: number, balanceAfter: number }>}
   */
  async generateImage(telegramId, prompt) {
    const { user, cost, free } = await this._checkAndDeduct(telegramId, 'IMAGE');

    const record = await pgGenerationHistoryRepository.create({
      userId: user.id,
      type: 'IMAGE',
      status: 'PENDING',
      prompt,
      provider: huggingFaceProvider.name,
      model: huggingFaceProvider.model,
      coinsSpent: cost,
    });

    try {
      const buffer = await huggingFaceProvider.generate(prompt);

      await pgGenerationHistoryRepository.markSuccess(record.id, {
        provider: huggingFaceProvider.name,
        model: huggingFaceProvider.model,
      });

      logger.info('Image generated', { telegramId, coinsSpent: cost, free });
      return { buffer, coinsSpent: cost, free };
    } catch (err) {
      await pgGenerationHistoryRepository.markFailed(record.id, err.message);
      throw new GenerationError(err.message, GENERATION_ERRORS.PROVIDER_FAILED, 502);
    }
  }

  /**
   * Edit an existing image using a source image URL + prompt.
   * @param {number} telegramId
   * @param {string} imageUrl  - URL of the source image
   * @param {string} prompt
   * @returns {Promise<{ buffer: Buffer, coinsSpent: number }>}
   */
  async editImage(telegramId, imageUrl, prompt) {
    const { user, cost } = await this._checkAndDeduct(telegramId, 'IMAGE_EDIT');

    const record = await pgGenerationHistoryRepository.create({
      userId: user.id,
      type: 'IMAGE',
      status: 'PENDING',
      prompt,
      provider: 'pollinations-edit',
      coinsSpent: cost,
    });

    try {
      const editUrl =
        `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
        `?image=${encodeURIComponent(imageUrl)}&width=1024&height=1024&nologo=true&enhance=true`;

      const response = await axios.get(editUrl, { responseType: 'arraybuffer', timeout: 60_000 });
      const buffer = Buffer.from(response.data);

      await pgGenerationHistoryRepository.markSuccess(record.id, { model: 'pollinations-img2img' });

      logger.info('Image edited', { telegramId, coinsSpent: cost });
      return { buffer, coinsSpent: cost };
    } catch (err) {
      await pgGenerationHistoryRepository.markFailed(record.id, err.message);
      throw new GenerationError(err.message, GENERATION_ERRORS.PROVIDER_FAILED, 502);
    }
  }

  /**
   * Generate a video from a text prompt.
   * @param {number} telegramId
   * @param {string} prompt
   * @param {Function} onProgress
   * @returns {Promise<{ url: string, coinsSpent: number }>}
   */
  async generateVideo(telegramId, prompt, onProgress) {
    const { user, cost } = await this._checkAndDeduct(telegramId, 'VIDEO');

    const record = await pgGenerationHistoryRepository.create({
      userId: user.id,
      type: 'VIDEO',
      status: 'PENDING',
      prompt,
      provider: falAiProvider.name,
      model: falAiProvider.model,
      coinsSpent: cost,
    });

    try {
      const result = await falAiProvider.generate(prompt, onProgress);

      await pgGenerationHistoryRepository.markSuccess(record.id, {
        mediaUrl: result.url,
        provider: falAiProvider.name,
        model: falAiProvider.model,
      });

      logger.info('Video generated', { telegramId, coinsSpent: cost });
      return { url: result.url, coinsSpent: cost };
    } catch (err) {
      await pgGenerationHistoryRepository.markFailed(record.id, err.message);
      throw new GenerationError(err.message, GENERATION_ERRORS.PROVIDER_FAILED, 502);
    }
  }

  /**
   * Get generation history for a user.
   * @param {number} telegramId
   * @param {'IMAGE'|'VIDEO'|undefined} type
   * @param {number} limit
   */
  async getHistory(telegramId, type, limit = 10) {
    const user = await userService.findByTelegramId(telegramId);
    if (!user) return [];
    if (type) return pgGenerationHistoryRepository.findByUserIdAndType(user.id, type, limit);
    return pgGenerationHistoryRepository.findByUserId(user.id, limit);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Returns true if the user has not yet used their free daily image generation today.
   * @param {object} user  Prisma User record
   */
  _isFreeEligible(user) {
    if (!user.lastFreeGenerationAt) return true;
    const last = new Date(user.lastFreeGenerationAt);
    const now = new Date();
    return (
      last.getUTCFullYear() !== now.getUTCFullYear() ||
      last.getUTCMonth() !== now.getUTCMonth() ||
      last.getUTCDate() !== now.getUTCDate()
    );
  }

  /**
   * Resolve user, apply free daily slot (IMAGE only) or deduct coins.
   * @param {number} telegramId
   * @param {'IMAGE'|'IMAGE_EDIT'|'VIDEO'} type
   * @returns {Promise<{ user: object, cost: number, free: boolean }>}
   */
  async _checkAndDeduct(telegramId, type) {
    const cost = GENERATION_COSTS[type];
    if (!cost) {
      throw new GenerationError(`Unsupported generation type: ${type}`, GENERATION_ERRORS.UNSUPPORTED_TYPE);
    }

    const user = await userService.findByTelegramId(telegramId);
    if (!user) {
      throw new GenerationError(`User not found for telegramId ${telegramId}`, GENERATION_ERRORS.USER_NOT_FOUND, 404);
    }

    // Free daily image slot — only for IMAGE type
    if (type === 'IMAGE' && this._isFreeEligible(user)) {
      await userService.setLastFreeGenerationAt(user.id);
      logger.info('Free daily image used', { telegramId });
      return { user, cost: 0, free: true };
    }

    const { valid, balance, shortfall } = await walletService.validateBalance(user.id, cost);
    if (!valid) {
      throw new GenerationError(
        `Insufficient coins: need ${cost}, have ${balance} (short ${shortfall})`,
        GENERATION_ERRORS.INSUFFICIENT_COINS
      );
    }

    const { wallet } = await walletService.deductCoins(user.id, cost, {
      type: 'SPEND',
      note: `${type} generation`,
    });

    return { user, cost, free: false, balanceAfter: wallet.balance };
  }
}

export default new GenerationService();
