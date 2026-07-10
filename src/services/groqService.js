/**
 * groqService — thin shim that delegates to groqProvider.
 * Kept for backward compatibility. Prefer importing groqProvider directly.
 */
import groqProvider from '../providers/groq.js';
import { DEFAULT_SYSTEM_PROMPT } from '../prompts/system.js';
import { AI_DEFAULTS } from '../constants/index.js';
import config from '../config/index.js';

class GroqServiceShim {
  async chat({ userMessage, history = [], systemPrompt, model, temperature, maxTokens }) {
    const messages = groqProvider.buildMessages(
      systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
      history,
      userMessage
    );
    return groqProvider.chat({
      messages,
      model: model ?? config.groq.model,
      temperature: temperature ?? AI_DEFAULTS.TEMPERATURE,
      maxTokens: maxTokens ?? AI_DEFAULTS.MAX_TOKENS,
    });
  }

  async *stream({ userMessage, history = [], systemPrompt, model, temperature, maxTokens }) {
    const messages = groqProvider.buildMessages(
      systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
      history,
      userMessage
    );
    yield* groqProvider.stream({
      messages,
      model: model ?? config.groq.model,
      temperature: temperature ?? AI_DEFAULTS.TEMPERATURE,
      maxTokens: maxTokens ?? AI_DEFAULTS.MAX_TOKENS,
    });
  }
}

export default new GroqServiceShim();
