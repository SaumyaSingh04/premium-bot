export class PaymentError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'PaymentError';
    this.code = code;
    this.statusCode = 400;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const PAYMENT_ERRORS = {
  PLAN_NOT_FOUND:      'PLAN_NOT_FOUND',
  USER_NOT_FOUND:      'USER_NOT_FOUND',
  PAYMENT_NOT_FOUND:   'PAYMENT_NOT_FOUND',
  ALREADY_COMPLETED:   'ALREADY_COMPLETED',
  VERIFICATION_FAILED: 'VERIFICATION_FAILED',
  PROVIDER_ERROR:      'PROVIDER_ERROR',
  DUPLICATE_CHARGE:    'DUPLICATE_CHARGE',
  INVALID_PAYLOAD:     'INVALID_PAYLOAD',
};
