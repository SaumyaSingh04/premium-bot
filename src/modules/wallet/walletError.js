export class WalletError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'WalletError';
    this.code = code;
    this.statusCode = 400;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const WALLET_ERRORS = {
  NOT_FOUND: 'WALLET_NOT_FOUND',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
};
