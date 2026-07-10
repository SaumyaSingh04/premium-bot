import paymentService from './paymentService.js';
import paymentRepository from '../../repositories/pg/pgPaymentRepository.js';
import userService from '../user/userService.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { HTTP_STATUS } from '../../constants/index.js';

// POST /api/v1/payments/order
export const createOrder = asyncHandler(async (req, res) => {
  const { telegramId, planId, provider } = req.body;
  const result = await paymentService.createOrder({ telegramId, planId, provider });
  sendSuccess(res, result, 'Order created', HTTP_STATUS.CREATED);
});

// POST /api/v1/payments/verify
export const verifyPayment = asyncHandler(async (req, res) => {
  const { paymentId, externalId, signature, raw } = req.body;
  const result = await paymentService.verifyPayment({ paymentId, externalId, signature, raw });
  sendSuccess(res, result, 'Payment verified');
});

// POST /api/v1/payments/webhook/:provider
export const webhook = asyncHandler(async (req, res) => {
  const result = await paymentService.webhook({
    providerName: req.params.provider,
    body: req.body,
    headers: req.headers,
  });
  sendSuccess(res, result);
});

// GET /api/v1/payments/:telegramId/history
export const getHistory = asyncHandler(async (req, res) => {
  const user = await userService.findByTelegramId(req.params.telegramId);
  if (!user) return sendError(res, 'User not found', HTTP_STATUS.NOT_FOUND);

  const limit  = Math.min(parseInt(req.query.limit)  || 20, 100);
  const offset = parseInt(req.query.offset) || 0;

  const payments = await paymentRepository.findByUserId(user.id, limit, offset);
  sendSuccess(res, { payments });
});
