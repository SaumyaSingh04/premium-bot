import creditsService from '../../modules/credits/creditsService.js';
import userService from '../../modules/user/userService.js';
import config from '../../config/index.js';
import { safeMarkdownReply } from '../../helpers/formatMessage.js';

const creditsCommand = async (ctx) => {
  const telegramId = ctx.from?.id;

  const [remaining, user] = await Promise.all([
    creditsService.getCredits(telegramId),
    userService.findByTelegramId(telegramId),
  ]);

  const resetAt = user?.credits?.lastResetAt
    ? new Date(user.credits.lastResetAt).toLocaleDateString()
    : 'N/A';

  const text =
    `💳 *Credits*\n\n` +
    `• Remaining: *${remaining}* / ${config.credits.dailyFree}\n` +
    `• Last reset: *${resetAt}*\n\n` +
    `Credits reset daily at midnight UTC.`;

  await safeMarkdownReply(ctx, text);
};

export default creditsCommand;
