import { IAIProvider } from './IAIProvider.js';

const MOCK_IMAGE_URL = 'https://placehold.co/1024x1024/png?text=Mock+Image';
const MOCK_VIDEO_URL = 'https://www.w3schools.com/html/mov_bbb.mp4';

export class MockAIProvider extends IAIProvider {
  get name() {
    return 'mock';
  }

  async generateImage({ prompt, width = 1024, height = 1024, style = 'realistic' }) {
    return {
      url: `${MOCK_IMAGE_URL}&prompt=${encodeURIComponent(prompt)}`,
      mimeType: 'image/png',
      meta: { provider: this.name, width, height, style, prompt },
    };
  }

  async editImage({ imageUrl, prompt, maskUrl = null }) {
    return {
      url: `${MOCK_IMAGE_URL}&edit=1&prompt=${encodeURIComponent(prompt)}`,
      mimeType: 'image/png',
      meta: { provider: this.name, sourceImageUrl: imageUrl, maskUrl, prompt },
    };
  }

  async generateVideo({ prompt, durationSec = 5, aspectRatio = '16:9', onProgress }) {
    // Simulate async progress ticks
    if (onProgress) {
      await onProgress('Queued…');
      await onProgress('Rendering frames…');
    }

    return {
      url: MOCK_VIDEO_URL,
      durationSec,
      meta: { provider: this.name, aspectRatio, prompt },
    };
  }
}

export default new MockAIProvider();
