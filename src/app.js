import express from 'express';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { applySecurityMiddleware } from './middleware/security.js';
import { globalRateLimiter } from './middleware/rateLimiter.js';
import errorHandler from './middleware/errorHandler.js';
import { sendSuccess } from './utils/response.js';
import { HTTP_STATUS } from './constants/index.js';
import logger from './logger/index.js';
import config from './config/index.js';
import sessionRepository from './repositories/sessionRepository.js';
import bot from './bot/bot.js';
import apiRoutes from './routes/index.js';
import paymentService from './modules/payment/paymentService.js';
import razorpayProvider from './modules/payment/RazorpayProvider.js';

const app = express();

// Register payment providers
paymentService.registerProvider(razorpayProvider);

// Security & parsing
applySecurityMiddleware(app);

// Raw body capture for Razorpay webhook signature verification
app.use('/api/v1/payments/webhook/razorpay', express.raw({ type: 'application/json' }));

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

  sendSuccess(res, {
    status: 'ok',
    env: config.env,
    uptime: Math.floor(process.uptime()),
    memory: process.memoryUsage().rss,
    db: dbStatus,
    users: sessionRepository.totalUsers(),
    messages: sessionRepository.globalMessageCount(),
    tokens: sessionRepository.globalTokenCount(),
    version: config.bot.version,
  }, 'Healthy');
});

// API routes (all modules)
app.use('/api/v1', apiRoutes);

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
