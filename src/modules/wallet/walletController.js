import walletService from './walletService.js';
import userService from '../user/userService.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { HTTP_STATUS } from '../../constants/index.js';
import { WalletError, WALLET_ERRORS } from './walletError.js';

/**
 * Resolve internal userId from telegramId param.
 * Returns null and sends 404 if user not found.
 * @private
 */
const resolveUserId = async (res, telegramId) => {
  const user = await userService.findByTelegramId(telegramId);
  if (!user) {
    sendError(res, 'User not found', HTTP_STATUS.NOT_FOUND);
    return null;
  }
  return user.id;
};

const handleWalletError = (res, err) => {
  if (err instanceof WalletError) {
    const status =
      err.code === WALLET_ERRORS.INSUFFICIENT_BALANCE
        ? HTTP_STATUS.BAD_REQUEST
        : err.code === WALLET_ERRORS.NOT_FOUND
        ? HTTP_STATUS.NOT_FOUND
        : HTTP_STATUS.BAD_REQUEST;
    return sendError(res, err.message, status);
  }
  throw err; // re-throw non-wallet errors to global handler
};

// GET /api/v1/wallet/:telegramId
export const getBalance = asyncHandler(async (req, res) => {
  const userId = await resolveUserId(res, req.params.telegramId);
  if (!userId) return;

  const balance = await walletService.getBalance(userId);
  sendSuccess(res, { balance });
});

// GET /api/v1/wallet/:telegramId/transactions
export const getTransactions = asyncHandler(async (req, res) => {
  const userId = await resolveUserId(res, req.params.telegramId);
  if (!userId) return;

  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = parseInt(req.query.offset) || 0;

  const transactions = await walletService.getTransactions(userId, limit, offset);
  sendSuccess(res, { transactions });
});

// POST /api/v1/wallet/:telegramId/add
export const addCoins = asyncHandler(async (req, res) => {
  const userId = await resolveUserId(res, req.params.telegramId);
  if (!userId) return;

  const { amount, type = 'ADMIN_GRANT', note, refId } = req.body;

  try {
    const result = await walletService.addCoins(userId, amount, { type, note, refId });
    sendSuccess(res, {
      balance: result.wallet.balance,
      transaction: result.transaction,
    }, 'Coins added');
  } catch (err) {
    handleWalletError(res, err);
  }
});

// POST /api/v1/wallet/:telegramId/deduct
export const deductCoins = asyncHandler(async (req, res) => {
  const userId = await resolveUserId(res, req.params.telegramId);
  if (!userId) return;

  const { amount, type = 'ADMIN_DEDUCT', note, refId } = req.body;

  try {
    const result = await walletService.deductCoins(userId, amount, { type, note, refId });
    sendSuccess(res, {
      balance: result.wallet.balance,
      transaction: result.transaction,
    }, 'Coins deducted');
  } catch (err) {
    handleWalletError(res, err);
  }
});

// GET /api/v1/wallet/:telegramId/validate?amount=50
export const validateBalance = asyncHandler(async (req, res) => {
  const userId = await resolveUserId(res, req.params.telegramId);
  if (!userId) return;

  const amount = parseInt(req.query.amount);
  if (!amount || amount <= 0) {
    return sendError(res, 'amount query param must be a positive integer', HTTP_STATUS.BAD_REQUEST);
  }

  try {
    const result = await walletService.validateBalance(userId, amount);
    sendSuccess(res, result);
  } catch (err) {
    handleWalletError(res, err);
  }
});
