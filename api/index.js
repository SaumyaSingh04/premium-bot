import 'dotenv/config';
import app from '../src/app.js';
import bot from '../src/bot/bot.js';
import config from '../src/config/index.js';
import { connectDB } from '../src/config/database.js';
import logger from '../src/logger/index.js';

let initPromise = null;

async function init() {
  await connectDB();

  try {
    await bot.telegram.setMyCommands([
      { command: 'start', description: 'Welcome message' },
      { command: 'help', description: 'Show available commands' },
      { command: 'chat', description: 'Chat with AI directly' },
      { command: 'image', description: 'Generate an AI image' },
      { command: 'video', description: 'Generate an AI video' },
      { command: 'history', description: 'View your recent history' },
      { command: 'profile', description: 'View your profile & credits' },
      { command: 'credits', description: 'Check your remaining credits' },
      { command: 'new', description: 'Start a new conversation' },
      { command: 'clear', description: 'Clear conversation history' },
      { command: 'settings', description: 'View your current settings' },
      { command: 'stats', description: 'Your usage statistics' },
      { command: 'ping', description: 'Check bot latency' },
      { command: 'about', description: 'About this bot' },
    ]);
  } catch (err) {
    logger.warn('Failed to set bot commands', { error: err.message });
  }

  try {
    const webhookUrl = `${config.telegram.webhookDomain}${config.telegram.webhookPath}`;
    await bot.telegram.setWebhook(webhookUrl);
    logger.info(`Webhook set to ${webhookUrl}`);
  } catch (err) {
    logger.warn('Failed to set webhook', { error: err.message });
  }
}

export default async function handler(req, res) {
  if (!initPromise) initPromise = init().catch((err) => {
    logger.error('Init failed', { error: err.message });
    initPromise = null; // allow retry on next request
  });
  await initPromise;
  return app(req, res);
}
