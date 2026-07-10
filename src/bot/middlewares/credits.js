import creditsService from '../../modules/credits/creditsService.js';
import { BOT_MESSAGES } from '../../constants/index.js';

const creditsMiddleware = async (ctx, next) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return next();

  const deducted = await creditsService.deductAndCheck(telegramId, ctx.from);

  if (!deducted) {
    return ctx.reply(BOT_MESSAGES.CREDITS_EXHAUSTED);
  }

  return next();
};

export default creditsMiddleware;
