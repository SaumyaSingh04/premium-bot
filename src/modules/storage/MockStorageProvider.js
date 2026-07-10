import { IStorageProvider } from './IStorageProvider.js';

const BASE_URL = 'https://cdn.mock.example.com';

export class MockStorageProvider extends IStorageProvider {
  get name() {
    return 'mock';
  }

  async uploadImage({ filename, folder = 'images', mimeType = 'image/png' }) {
    const key = `${folder}/${filename}`;
    return {
      url: `${BASE_URL}/${key}`,
      key,
      meta: { provider: this.name, mimeType },
    };
  }

  async uploadVideo({ filename, folder = 'videos', mimeType = 'video/mp4', sourceUrl = null }) {
    const key = `${folder}/${filename}`;
    return {
      url: `${BASE_URL}/${key}`,
      key,
      meta: { provider: this.name, mimeType, sourceUrl },
    };
  }
}

export default new MockStorageProvider();
