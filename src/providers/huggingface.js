import axios from 'axios';
import logger from '../logger/index.js';
import config from '../config/index.js';

/**
 * Pollinations.ai image generation (configured under huggingface provider key).
 */
class HuggingFaceProvider {
  async generate(prompt) {
    logger.info('Pollinations image request', { prompt });

    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&enhance=true`;

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 60_000,
    });

    const buffer = Buffer.from(response.data);
    logger.info('Pollinations image generated', { bytes: buffer.length });
    return buffer;
  }

  get model() {
    return config.image.huggingFace.model;
  }

  get name() {
    return 'huggingface';
  }
}

export default new HuggingFaceProvider();
