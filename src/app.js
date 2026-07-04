import express from 'express';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { applySecurityMiddleware } from './middleware/security.js';
import { globalRateLimiter } from './middleware/rateLimiter.js';
import errorHandler from './middleware/errorHandler.js';
import { sendSuccess } from './utils/response.js';
import { HTTP_STATUS } from './constants/index.js';
import { chat, clearHistory } from './controllers/chatController.js';
import { validate, chatSchema } from './validators/chat.js';
import logger from './logger/index.js';
import config from './config/index.js';
import { connectDB } from './config/database.js';
import sessionRepository from './repositories/sessionRepository.js';
import userRepository from './repositories/userRepository.js';
import bot from './bot/bot.js';

// Connect to MongoDB (required on Vercel since server.js is not run)
connectDB().catch((err) => logger.error('MongoDB connection failed', { error: err.message }));

// Register webhook with Telegram on cold start (idempotent)
if (config.isProduction && config.telegram.webhookDomain) {
  const webhookUrl = `${config.telegram.webhookDomain}${config.telegram.webhookPath}`;
  bot.telegram.setWebhook(webhookUrl).catch((err) => logger.error('Failed to set webhook', { error: err.message }));
}

const app = express();

// Security & parsing
applySecurityMiddleware(app);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

// HTTP request logging
app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
    skip: (req) => req.path === '/health',
  })
);

// Rate limiting
app.use('/api/', globalRateLimiter);

// Health check
app.get('/health', (req, res) => {
  if (config.admin.healthSecret && req.query.secret !== config.admin.healthSecret) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
  }

  const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbStatus = dbState[mongoose.connection.readyState] ?? 'unknown';

  const isDbConnected = mongoose.connection.readyState === 1;
  let users = sessionRepository.totalUsers();
  let messages = sessionRepository.globalMessageCount();
  let tokens = sessionRepository.globalTokenCount();

  if (isDbConnected) {
    try {
      const [count, [globalStats]] = await Promise.all([
        userRepository.totalUsers(),
        userRepository.globalStats(),
      ]);
      users = count;
      messages = globalStats?.totalMessages ?? 0;
      tokens = globalStats?.totalTokens ?? 0;
    } catch (_) { /* fall back to in-memory */ }
  }

  sendSuccess(res, {
    status: 'ok',
    env: config.env,
    uptime: Math.floor(process.uptime()),
    memory: process.memoryUsage().rss,
    db: dbStatus,
    users,
    messages,
    tokens,
    version: config.bot.version,
  }, 'Healthy');
});

// API routes
const router = express.Router();

router.get('/status', (req, res) => {
  sendSuccess(res, { status: 'running', timestamp: new Date().toISOString() }, 'Bot is running');
});

router.post('/chat', validate(chatSchema), chat);
router.post('/chat/clear', clearHistory);

app.use('/api/v1', router);

// Telegram webhook
app.post(config.telegram.webhookPath, bot.webhookCallback(config.telegram.webhookPath));

// Root route
app.get('/', (req, res) => {
  res.json({ success: true, message: `${config.bot.name} v${config.bot.version} is running` });
});

// 404 handler
app.use((req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

export default app;
