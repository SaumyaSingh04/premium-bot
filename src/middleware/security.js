import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import config from '../config/index.js';

const corsOptions = {
  origin: config.isProduction ? config.cors.origin.split(',') : '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

export const applySecurityMiddleware = (app) => {
  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(compression());
};
