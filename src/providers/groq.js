import OpenAI from 'openai';
import config from '../config/index.js';

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 8_000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class GroqProvider {
  constructor() {
    this._client = new OpenAI({
      apiKey: config.groq.apiKey,
      baseURL: config.groq.baseURL,
      timeout: REQUEST_TIMEOUT_MS,
      maxRetries: 0,
    });
  }

  buildMessages(systemPrompt, history, userMessage) {
    return [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: userMessage },
    ];
  }

  async chat({ messages, model, temperature, maxTokens }) {
    const params = { model, messages, temperature, max_tokens: maxTokens };
    let lastError;

    for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
      try {
        const completion = await this._client.chat.completions.create(params);
        return {
          content: completion.choices[0]?.message?.content ?? '',
          usage: completion.usage ?? {},
        };
      } catch (err) {
        lastError = err;
        if (!this._isRetryable(err) || attempt === RETRY_ATTEMPTS) break;
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }

    throw this._normalizeError(lastError);
  }

  async *stream({ messages, model, temperature, maxTokens }) {
    const stream = await this._client.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }

  _isRetryable(err) {
    if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') return true;
    if (err.status === 429 || err.status >= 500) return true;
    return false;
  }

  _normalizeError(err) {
    if (err.status === 429) {
      const e = new Error('AI service is rate-limited. Please try again in a moment.');
      e.code = 'RATE_LIMITED';
      return e;
    }
    if (err.status === 401) {
      const e = new Error('AI service authentication failed.');
      e.code = 'AUTH_ERROR';
      return e;
    }
    if (err.code === 'ETIMEDOUT' || err.name === 'APIConnectionTimeoutError') {
      const e = new Error('AI service timed out. Please try again.');
      e.code = 'TIMEOUT';
      return e;
    }
    return err;
  }
}

export default new GroqProvider();
