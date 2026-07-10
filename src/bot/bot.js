import { Telegraf } from 'telegraf';
import config from '../config/index.js';
import logger from '../logger/index.js';
import { BOT_MESSAGES } from '../constants/index.js';

import loggerMiddleware from './middlewares/logger.js';
import sessionMiddleware from './middlewares/session.js';
import typingMiddleware from './middlewares/typing.js';
import creditsMiddleware from './middlewares/credits.js';
import adminMiddleware from './middlewares/admin.js';

import startCommand from './commands/start.js';
import helpCommand from './commands/help.js';
import chatCommand from './commands/chat.js';
import clearCommand from './commands/clear.js';
import newCommand from './commands/new.js';
import pingCommand from './commands/ping.js';
import aboutCommand from './commands/about.js';
import statsCommand from './commands/stats.js';
import settingsCommand from './commands/settings.js';
import imageCommand from './commands/image.js';
import imageEditCommand from './commands/imageEdit.js';
import videoCommand from './commands/video.js';
import historyCommand from './commands/history.js';
import balanceCommand from './commands/balance.js';
import plansCommand from './commands/plans.js';
import generateCommand from './commands/generate.js';
import editCommand from './commands/edit.js';
import profileCommand from './commands/profile.js';
import creditsCommand from './commands/credits.js';
import adminCommand from './commands/admin.js';
import buyCommand, { buyCallbackHandler } from './commands/buy.js';
import messageHandler from './handlers/messageHandler.js';
import { preCheckoutHandler, successfulPaymentHandler } from './handlers/starsPaymentHandler.js';

const bot = new Telegraf(config.telegram.token);

// Per-user Telegram-level rate limiter (10 messages per 10s)
const userRateMap = new Map();
const RATE_WINDOW_MS = 10_000;
const RATE_MAX = 10;

const telegramRateLimiter = (ctx, next) => {
  const userId = ctx.from?.id;
  if (!userId) return next();

  const now = Date.now();
  const entry = userRateMap.get(userId) ?? { count: 0, resetAt: now + RATE_WINDOW_MS };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + RATE_WINDOW_MS;
  }

  entry.count++;
  userRateMap.set(userId, entry);

  if (entry.count > RATE_MAX) {
    return ctx.reply(BOT_MESSAGES.RATE_LIMITED);
  }

  return next();
};

// Cleanup stale rate entries every 5 minutes
const rateLimitCleanup = setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of userRateMap) {
    if (now > entry.resetAt) userRateMap.delete(id);
  }
}, 300_000);
rateLimitCleanup.unref();

// Global middlewares
bot.use(loggerMiddleware);
bot.use(sessionMiddleware);
bot.use(telegramRateLimiter);
bot.use(typingMiddleware);

// Commands
bot.command('start', startCommand);
bot.command('help', helpCommand);
bot.command('ping', pingCommand);
bot.command('about', aboutCommand);
bot.command('stats', statsCommand);
bot.command('settings', settingsCommand);
bot.command('clear', clearCommand);
bot.command('new', newCommand);
bot.command('chat', creditsMiddleware, chatCommand);
bot.command('balance', balanceCommand);
bot.command('plans', plansCommand);
bot.command('history', historyCommand);
bot.command('generate', creditsMiddleware, generateCommand);
bot.command('edit', creditsMiddleware, editCommand);
bot.command('video', creditsMiddleware, videoCommand);
bot.command('image', creditsMiddleware, imageCommand);
bot.command('imageedit', creditsMiddleware, imageEditCommand);
bot.command('profile', profileCommand);
bot.command('credits', creditsCommand);
bot.command('admin', adminMiddleware, adminCommand);
bot.command('buy', buyCommand);

// Telegram Stars — must be registered before the generic message handler
bot.on('pre_checkout_query', preCheckoutHandler);
bot.on('message', (ctx, next) => {
  if (ctx.message?.successful_payment) return successfulPaymentHandler(ctx);
  return next();
});

// Inline button handler for buy:<planId>
bot.action(/^buy:\d+$/, buyCallbackHandler);

// Text messages (free-form chat)
bot.on('text', creditsMiddleware, messageHandler);

// Unknown commands — must come BEFORE the generic message handler
bot.on('message', (ctx, next) => {
  if (ctx.message?.text?.startsWith('/')) {
    return ctx.reply(BOT_MESSAGES.UNKNOWN_COMMAND);
  }
  return next();
});

// Graceful error handling — do not crash the process
bot.catch((err, ctx) => {
  logger.error('Telegraf unhandled error', {
    updateType: ctx.updateType,
    error: err.message,
    stack: err.stack,
  });
});

export default bot;
