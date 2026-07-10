import mockAIProvider from './MockAIProvider.js';

/**
 * AIProviderService
 *
 * - Holds a registry of IAIProvider adapters.
 * - One provider is marked "active" at a time.
 * - Exposes generateImage(), editImage(), generateVideo() as the
 *   single entry point for all AI generation calls.
 *
 * Swap providers at runtime:
 *   aiProviderService.registerProvider(new OpenAIProvider());
 *   aiProviderService.setActiveProvider('openai');
 */
class AIProviderService {
  /** @type {Map<string, import('./IAIProvider.js').IAIProvider>} */
  #providers = new Map();
  #activeName = null;

  constructor() {
    this.registerProvider(mockAIProvider);
    this.setActiveProvider('mock');
  }

  // ---------------------------------------------------------------------------
  // Registry
  // ---------------------------------------------------------------------------

  /** @param {import('./IAIProvider.js').IAIProvider} provider */
  registerProvider(provider) {
    this.#providers.set(provider.name, provider);
  }

  /** @param {string} name */
  setActiveProvider(name) {
    if (!this.#providers.has(name)) {
      throw new Error(`AI provider "${name}" is not registered`);
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
   * @param {Parameters<import('./IAIProvider.js').IAIProvider['generateImage']>[0]} params
   * @returns {ReturnType<import('./IAIProvider.js').IAIProvider['generateImage']>}
   */
  generateImage(params) {
    return this.activeProvider.generateImage(params);
  }

  /**
   * @param {Parameters<import('./IAIProvider.js').IAIProvider['editImage']>[0]} params
   * @returns {ReturnType<import('./IAIProvider.js').IAIProvider['editImage']>}
   */
  editImage(params) {
    return this.activeProvider.editImage(params);
  }

  /**
   * @param {Parameters<import('./IAIProvider.js').IAIProvider['generateVideo']>[0]} params
   * @returns {ReturnType<import('./IAIProvider.js').IAIProvider['generateVideo']>}
   */
  generateVideo(params) {
    return this.activeProvider.generateVideo(params);
  }
}

export default new AIProviderService();
