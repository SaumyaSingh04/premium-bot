import mongoose from 'mongoose';
import config from './index.js';
import logger from '../logger/index.js';

mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
mongoose.connection.on('error', (err) => logger.error('MongoDB error', { error: err.message }));

export async function connectDB() {
  await mongoose.connect(config.mongodb.uri, {
    serverSelectionTimeoutMS: 5_000,
    socketTimeoutMS: 10_000,
    connectTimeoutMS: 5_000,
  });
  logger.info('MongoDB connected');
}

export async function disconnectDB() {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}
