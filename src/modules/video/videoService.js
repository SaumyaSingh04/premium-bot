import falAiProvider from '../../providers/falai.js';
import videoHistoryRepository from '../../repositories/videoHistoryRepository.js';
import config from '../../config/index.js';
import logger from '../../logger/index.js';

const providers = {
  falai: falAiProvider,
};

class VideoService {
  _getProvider() {
    const provider = providers[config.video.provider];
    if (!provider) throw new Error(`Unknown video provider: "${config.video.provider}"`);
    return provider;
  }

  async generate(telegramId, prompt, onProgress) {
    const provider = this._getProvider();

    try {
      const result = await provider.generate(prompt, onProgress);

      await videoHistoryRepository.create({
        telegramId,
        prompt,
        provider: provider.name,
        model: provider.model,
        videoUrl: result.url,
        status: 'success',
      });

      logger.info('Video generated', { telegramId, provider: provider.name });
      return result;
    } catch (err) {
      logger.error('Video generation failed', { telegramId, prompt, error: err.message });

      await videoHistoryRepository
        .create({ telegramId, prompt, provider: provider.name, status: 'failed', error: err.message })
        .catch(() => {});

      throw err;
    }
  }

  getHistory(telegramId, limit = 10) {
    return videoHistoryRepository.findByTelegramId(telegramId, limit);
  }
}

export default new VideoService();
