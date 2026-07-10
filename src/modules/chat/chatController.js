import chatService from './chatService.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { HTTP_STATUS } from '../../constants/index.js';

export const chat = asyncHandler(async (req, res) => {
  const { message, userId = 'api-user' } = req.body;
  const { reply, usage } = await chatService.handleMessage(userId, message);
  sendSuccess(res, { reply, usage }, 'OK', HTTP_STATUS.OK);
});

export const clearHistory = asyncHandler(async (req, res) => {
  const { userId = 'api-user' } = req.body;
  await chatService.clearHistory(userId);
  sendSuccess(res, null, 'History cleared', HTTP_STATUS.OK);
});
