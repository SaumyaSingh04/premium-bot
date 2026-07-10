import { PrismaClient } from '@prisma/client';
import logger from '../logger/index.js';

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

prisma.$on('error', (e) => logger.error('Prisma error', { message: e.message }));
prisma.$on('warn', (e) => logger.warn('Prisma warning', { message: e.message }));

export async function connectPrisma() {
  await prisma.$connect();
  logger.info('PostgreSQL connected (Prisma)');
}

export async function disconnectPrisma() {
  await prisma.$disconnect();
  logger.info('PostgreSQL disconnected (Prisma)');
}

export default prisma;
