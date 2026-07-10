/**
 * IAIProvider — interface every AI provider adapter must implement.
 *
 * Each method receives a typed params object and must return a
 * provider-agnostic result shape so callers never depend on
 * provider-specific response structures.
 */
export class IAIProvider {
  /** Unique provider identifier, e.g. 'mock' | 'openai' | 'falai' */
  get name() {
    throw new Error(`${this.constructor.name} must implement get name()`);
  }

  /**
   * Generate an image from a text prompt.
   *
   * @param {object} params
   * @param {string} params.prompt
   * @param {number} [params.width]
   * @param {number} [params.height]
   * @param {string} [params.style]       e.g. 'realistic' | 'anime' | 'sketch'
   * @returns {Promise<{ url: string, mimeType: string, meta: object }>}
   */
  // eslint-disable-next-line no-unused-vars
  async generateImage(params) {
    throw new Error(`${this.constructor.name} must implement generateImage()`);
  }

  /**
   * Edit / transform an existing image.
   *
   * @param {object} params
   * @param {string} params.imageUrl      Source image URL or base64 data URI
   * @param {string} params.prompt        Edit instruction
   * @param {string} [params.maskUrl]     Optional inpainting mask
   * @returns {Promise<{ url: string, mimeType: string, meta: object }>}
   */
  // eslint-disable-next-line no-unused-vars
  async editImage(params) {
    throw new Error(`${this.constructor.name} must implement editImage()`);
  }

  /**
   * Generate a video from a text prompt.
   *
   * @param {object} params
   * @param {string} params.prompt
   * @param {number} [params.durationSec]
   * @param {string} [params.aspectRatio]  e.g. '16:9' | '9:16' | '1:1'
   * @param {(status: string) => void} [params.onProgress]
   * @returns {Promise<{ url: string, durationSec: number, meta: object }>}
   */
  // eslint-disable-next-line no-unused-vars
  async generateVideo(params) {
    throw new Error(`${this.constructor.name} must implement generateVideo()`);
  }
}
