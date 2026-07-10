export class GenerationError extends Error {
  constructor(message, code, statusCode = 400) {
    super(message);
    this.name = 'GenerationError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const GENERATION_ERRORS = {
  INSUFFICIENT_COINS: 'INSUFFICIENT_COINS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  PROVIDER_FAILED: 'PROVIDER_FAILED',
  UNSUPPORTED_TYPE: 'UNSUPPORTED_TYPE',
};
