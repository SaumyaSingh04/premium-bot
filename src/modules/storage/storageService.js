import mockStorageProvider from './MockStorageProvider.js';
import crypto from 'crypto';

/**
 * StorageService
 *
 * - Holds a registry of IStorageProvider adapters.
 * - One provider is marked "active" at a time.
 * - Exposes uploadImage() and uploadVideo() as the single entry point.
 *
 * Swap providers at runtime:
 *   storageService.registerProvider(new S3StorageProvider());
 *   storageService.setActiveProvider('s3');
 */
class StorageService {
  /** @type {Map<string, import('./IStorageProvider.js').IStorageProvider>} */
  #providers = new Map();
  #activeName = null;

  constructor() {
    this.registerProvider(mockStorageProvider);
    this.setActiveProvider('mock');
  }

  // ---------------------------------------------------------------------------
  // Registry
  // ---------------------------------------------------------------------------

  /** @param {import('./IStorageProvider.js').IStorageProvider} provider */
  registerProvider(provider) {
    this.#providers.set(provider.name, provider);
  }

  /** @param {string} name */
  setActiveProvider(name) {
    if (!this.#providers.has(name)) {
      throw new Error(`Storage provider "${name}" is not registered`);
    }
    this.#activeName = name;
  }

  get activeProvider() {
    return this.#providers.get(this.#activeName);
  }

  // ---------------------------------------------------------------------------
  // Facade
  // ---------------------------------------------------------------------------

  /**
   * Upload an image buffer. Auto-generates a unique filename if not provided.
   *
   * @param {object} params
   * @param {Buffer} params.buffer
   * @param {string} [params.filename]
   * @param {string} [params.mimeType]
   * @param {string} [params.folder]
   * @returns {Promise<{ url: string, key: string, meta: object }>}
   */
  uploadImage({ buffer, filename, mimeType = 'image/png', folder = 'images' }) {
    return this.activeProvider.uploadImage({
      buffer,
      filename: filename ?? `${this._uid()}.png`,
      mimeType,
      folder,
    });
  }

  /**
   * Upload a video by URL or buffer. Auto-generates a unique filename if not provided.
   *
   * @param {object} params
   * @param {string} [params.sourceUrl]
   * @param {Buffer} [params.buffer]
   * @param {string} [params.filename]
   * @param {string} [params.mimeType]
   * @param {string} [params.folder]
   * @returns {Promise<{ url: string, key: string, meta: object }>}
   */
  uploadVideo({ sourceUrl, buffer, filename, mimeType = 'video/mp4', folder = 'videos' }) {
    return this.activeProvider.uploadVideo({
      sourceUrl,
      buffer,
      filename: filename ?? `${this._uid()}.mp4`,
      mimeType,
      folder,
    });
  }

  // ---------------------------------------------------------------------------

  _uid() {
    return crypto.randomBytes(8).toString('hex');
  }
}

export default new StorageService();
