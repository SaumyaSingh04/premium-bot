import mongoose from 'mongoose';
import config from './index.js';
import logger from '../logger/index.js';

mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
mongoose.connection.on('error', (err) => logger.error('MongoDB error', { error: err.message }));

export async function connectDB(retries = 5, delay = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      await mongoose.connect(config.mongodb.uri, {
        serverSelectionTimeoutMS: 5_000,
        socketTimeoutMS: 10_000,
        connectTimeoutMS: 5_000,
      });
      logger.info('MongoDB connected');
      return;
    } catch (err) {
      logger.warn(`MongoDB connection attempt ${i}/${retries} failed: ${err.message}`);
      if (i < retries) await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error('MongoDB failed to connect after all retries');
}

export async function disconnectDB() {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}
