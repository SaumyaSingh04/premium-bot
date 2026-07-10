import groqProvider from '../../providers/groq.js';
import sessionRepository from '../../repositories/sessionRepository.js';
import chatHistoryRepository from '../../repositories/chatHistoryRepository.js';
import { DEFAULT_SYSTEM_PROMPT } from '../../prompts/system.js';
import { AI_DEFAULTS } from '../../constants/index.js';
import config from '../../config/index.js';
import logger from '../../logger/index.js';

class ChatService {
  async handleMessage(userId, text) {
    const history = sessionRepository.getHistory(userId);
    const settings = sessionRepository.getSettings(userId);

    const messages = groqProvider.buildMessages(
      DEFAULT_SYSTEM_PROMPT,
      history,
      text
    );

    const { content, usage } = await groqProvider.chat({
      messages,
      model: settings.model ?? AI_DEFAULTS.MODEL,
      temperature: settings.temperature ?? AI_DEFAULTS.TEMPERATURE,
      maxTokens: settings.maxTokens ?? AI_DEFAULTS.MAX_TOKENS,
    });

    sessionRepository.addMessage(userId, 'user', text);
    sessionRepository.addMessage(userId, 'assistant', content);
    sessionRepository.updateStats(userId, usage.total_tokens ?? 0);

    await chatHistoryRepository.addMessage(userId, 'user', text).catch(() => {});
    await chatHistoryRepository.addMessage(userId, 'assistant', content).catch(() => {});

    logger.info('Chat message processed', { userId, tokens: usage.total_tokens });

    return { reply: content, usage };
  }

  clearHistory(userId) {
    sessionRepository.clearHistory(userId);
    return chatHistoryRepository.clearMessages(userId).catch(() => {});
  }

  getStats(userId) {
    return sessionRepository.getStats(userId);
  }

  getSettings(userId) {
    return sessionRepository.getSettings(userId);
  }

  updateSettings(userId, patch) {
    sessionRepository.updateSettings(userId, patch);
  }

  totalUsers() {
    return sessionRepository.totalUsers();
  }

  globalMessageCount() {
    return sessionRepository.globalMessageCount();
  }

  globalTokenCount() {
    return sessionRepository.globalTokenCount();
  }
}

export default new ChatService();
