/**
 * IStorageProvider — interface every storage adapter must implement.
 *
 * Adapters (S3, GCS, Cloudinary, local disk, …) extend this class and
 * override all methods. StorageService depends only on this interface,
 * so swapping providers requires zero changes outside the adapter.
 */
export class IStorageProvider {
  /** Unique provider identifier, e.g. 'mock' | 's3' | 'gcs' | 'cloudinary' */
  get name() {
    throw new Error(`${this.constructor.name} must implement get name()`);
  }

  /**
   * Upload an image buffer and return its public URL.
   *
   * @param {object} params
   * @param {Buffer} params.buffer        Raw image bytes
   * @param {string} params.filename      Desired filename (without path)
   * @param {string} [params.mimeType]    e.g. 'image/png' | 'image/jpeg'
   * @param {string} [params.folder]      Storage folder / prefix
   * @returns {Promise<{ url: string, key: string, meta: object }>}
   */
  // eslint-disable-next-line no-unused-vars
  async uploadImage(params) {
    throw new Error(`${this.constructor.name} must implement uploadImage()`);
  }

  /**
   * Upload a video by URL or buffer and return its public URL.
   *
   * @param {object} params
   * @param {string} [params.sourceUrl]   Remote video URL to re-host
   * @param {Buffer} [params.buffer]      Raw video bytes (alternative to sourceUrl)
   * @param {string} params.filename      Desired filename (without path)
   * @param {string} [params.mimeType]    e.g. 'video/mp4'
   * @param {string} [params.folder]      Storage folder / prefix
   * @returns {Promise<{ url: string, key: string, meta: object }>}
   */
  // eslint-disable-next-line no-unused-vars
  async uploadVideo(params) {
    throw new Error(`${this.constructor.name} must implement uploadVideo()`);
  }
}
