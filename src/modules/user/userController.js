import userService from './userService.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { HTTP_STATUS } from '../../constants/index.js';

const serializeUser = (user) => ({
  id: user.id,
  telegramId: user.telegramId.toString(), // BigInt → string for JSON
  username: user.username,
  firstName: user.firstName,
  lastName: user.lastName,
  coinBalance: user.wallet?.balance ?? 0,
  totalMessages: user.totalMessages,
  totalTokens: user.totalTokens,
  lastActiveAt: user.lastActiveAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const getProfile = asyncHandler(async (req, res) => {
  const { telegramId } = req.params;
  const user = await userService.findByTelegramId(telegramId);

  if (!user) {
    return sendError(res, 'User not found', HTTP_STATUS.NOT_FOUND);
  }

  sendSuccess(res, serializeUser(user));
});

export const getStats = asyncHandler(async (req, res) => {
  const [count, stats] = await Promise.all([
    userService.count(),
    userService.globalStats(),
  ]);

  sendSuccess(res, {
    totalUsers: count,
    totalMessages: stats._sum.totalMessages ?? 0,
    totalTokens: stats._sum.totalTokens ?? 0,
  });
});
