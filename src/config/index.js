import 'dotenv/config';
import Joi from 'joi';

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),

  MONGODB_URI: Joi.string().required(),
  DATABASE_URL: Joi.string().required(),

  IMAGE_PROVIDER: Joi.string().default('huggingface'),
  HUGGINGFACE_TOKEN: Joi.string().optional().default(''),
  HUGGINGFACE_IMAGE_MODEL: Joi.string().default('black-forest-labs/FLUX.1-schnell'),

  VIDEO_PROVIDER: Joi.string().default('falai'),
  FAL_AI_API_KEY: Joi.string().optional().default(''),
  FAL_AI_VIDEO_MODEL: Joi.string().default('fal-ai/kling-video/v1.6/standard/text-to-video'),

  DAILY_FREE_CREDITS: Joi.number().default(20),

  RAZORPAY_KEY_ID: Joi.string().optional().default(''),
  RAZORPAY_KEY_SECRET: Joi.string().optional().default(''),
  RAZORPAY_WEBHOOK_SECRET: Joi.string().optional().default(''),

  ADMIN_IDS: Joi.string().allow('').optional().default(''),
  HEALTH_SECRET: Joi.string().allow('').optional().default(''),
  PORT: Joi.number().default(3000),

  BOT_TOKEN: Joi.string().required(),
  WEBHOOK_DOMAIN: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  WEBHOOK_PATH: Joi.string().default('/webhook/telegram'),

  GROQ_API_KEY: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.string().default(''),
  }),
  GROQ_BASE_URL: Joi.string().uri().default('https://api.groq.com/openai/v1'),
  GROQ_MODEL: Joi.string().default('llama-3.3-70b-versatile'),

  RATE_LIMIT_WINDOW_MS: Joi.number().default(60000),
  RATE_LIMIT_MAX: Joi.number().default(100),

  CORS_ORIGIN: Joi.string().default('*'),

  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),

  BOT_NAME: Joi.string().default('Groq AI Bot'),
  BOT_VERSION: Joi.string().default('1.0.0'),
}).unknown(true);

const { error, value: env } = schema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export default {
  env: env.NODE_ENV,
  port: env.PORT,
  isProduction: env.NODE_ENV === 'production',

  bot: {
    name: env.BOT_NAME,
    version: env.BOT_VERSION,
  },

  telegram: {
    token: env.BOT_TOKEN,
    webhookDomain: env.WEBHOOK_DOMAIN,
    webhookPath: env.WEBHOOK_PATH,
  },

  groq: {
    apiKey: env.GROQ_API_KEY,
    baseURL: env.GROQ_BASE_URL,
    model: env.GROQ_MODEL,
  },

  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
  },

  log: {
    level: env.LOG_LEVEL,
  },

  cors: {
    origin: env.CORS_ORIGIN,
  },

  mongodb: {
    uri: env.MONGODB_URI,
  },

  pg: {
    url: env.DATABASE_URL,
  },

  image: {
    provider: env.IMAGE_PROVIDER,
    huggingFace: {
      token: env.HUGGINGFACE_TOKEN,
      model: env.HUGGINGFACE_IMAGE_MODEL,
    },
  },

  video: {
    provider: env.VIDEO_PROVIDER,
    falAi: {
      apiKey: env.FAL_AI_API_KEY,
      model: env.FAL_AI_VIDEO_MODEL,
    },
  },

  credits: {
    dailyFree: env.DAILY_FREE_CREDITS,
  },

  admin: {
    ids: env.ADMIN_IDS ? env.ADMIN_IDS.split(',').map((id) => parseInt(id.trim(), 10)).filter(Boolean) : [],
    healthSecret: env.HEALTH_SECRET,
  },

  razorpay: {
    keyId: env.RAZORPAY_KEY_ID,
    keySecret: env.RAZORPAY_KEY_SECRET,
    webhookSecret: env.RAZORPAY_WEBHOOK_SECRET,
  },
};
