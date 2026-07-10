import huggingFaceProvider from '../../providers/huggingface.js';
import imageHistoryRepository from '../../repositories/imageHistoryRepository.js';
import config from '../../config/index.js';
import logger from '../../logger/index.js';

const providers = {
  huggingface: huggingFaceProvider,
};

class ImageService {
  _getProvider() {
    const provider = providers[config.image.provider];
    if (!provider) throw new Error(`Unknown image provider: "${config.image.provider}"`);
    return provider;
  }

  async generate(telegramId, prompt) {
    const provider = this._getProvider();

    try {
      const buffer = await provider.generate(prompt);

      await imageHistoryRepository.create({
        telegramId,
        prompt,
        provider: provider.name,
        model: provider.model,
        status: 'success',
      });

      logger.info('Image generated', { telegramId, provider: provider.name });
      return buffer;
    } catch (err) {
      logger.error('Image generation failed', { telegramId, prompt, error: err.message });

      await imageHistoryRepository
        .create({ telegramId, prompt, provider: provider.name, status: 'failed', error: err.message })
        .catch(() => {});

      throw err;
    }
  }

  getHistory(telegramId, limit = 10) {
    return imageHistoryRepository.findByTelegramId(telegramId, limit);
  }
}

export default new ImageService();
