import 'dotenv/config';
import app from './app.js';
import bot from './bot/bot.js';
import config from './config/index.js';
import { connectDB, disconnectDB } from './config/database.js';
import { connectPrisma, disconnectPrisma } from './config/prisma.js';
import logger from './logger/index.js';

const { port, isProduction, telegram } = config;

async function start() {
  try {
    await connectDB();
    await connectPrisma();

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
    } catch (cmdErr) {
      logger.warn('Failed to set bot commands (non-fatal)', { error: cmdErr.message });
    }

    if (isProduction) {
      const webhookPath = telegram.webhookPath;
      const webhookUrl = `${telegram.webhookDomain}${webhookPath}`;
      await bot.telegram.setWebhook(webhookUrl);
      app.use(webhookPath, bot.webhookCallback(webhookPath));
      logger.info(`Webhook set to ${webhookUrl}`);
    } else {
      await bot.telegram.deleteWebhook();
      bot.launch();
      logger.info('Bot started in polling mode');
    }

    const server = app.listen(port, () => {
      logger.info(`Server running on port ${port} [${config.env}]`);
    });

    const shutdown = async (signal) => {
      logger.info(`${signal} received — shutting down`);
      bot.stop(signal);

      // Force exit after 10s if graceful shutdown hangs
      const forceExit = setTimeout(() => {
        logger.warn('Forced exit after timeout');
        process.exit(1);
      }, 10_000);
      forceExit.unref();

      server.close(async () => {
        logger.info('HTTP server closed');
        await disconnectDB();
        await disconnectPrisma();
        process.exit(0);
      });
    };

    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught exception', { error: err.message, stack: err.stack });
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection', { reason: String(reason) });
    });
  } catch (err) {
    logger.error('Failed to start server', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

start();
