import axios from 'axios';
import { ImageProvider } from './ImageProvider.js';
import logger from '../../logger/index.js';

export class HuggingFaceProvider extends ImageProvider {
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
}
