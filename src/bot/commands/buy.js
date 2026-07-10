import coinPlanService from '../../modules/coinPlan/coinPlanService.js';
import starsPaymentService from '../../modules/payment/stars/starsPaymentService.js';
import { safeMarkdownReply } from '../../helpers/formatMessage.js';
import logger from '../../logger/index.js';

/**
 * /buy command — lists all active plans that have a starsAmount configured.
 * Each plan gets an inline "Buy" button that triggers a Stars invoice.
 */
const buyCommand = async (ctx) => {
  const plans = await coinPlanService.getPlans();
  const starsPlans = plans.filter((p) => p.starsAmount > 0);

  if (!starsPlans.length) {
    return ctx.reply('No coin plans are available for purchase right now.');
  }

  const lines = ['⭐ *Buy Coins with Telegram Stars*\n'];
  const buttons = [];

  for (const plan of starsPlans) {
    lines.push(`*${plan.name}*`);
    lines.push(`• ${plan.coins} coins`);
    lines.push(`• ${plan.starsAmount} ⭐\n`);
    buttons.push([{ text: `Buy ${plan.name} — ${plan.starsAmount} ⭐`, callback_data: `buy:${plan.id}` }]);
  }

  await safeMarkdownReply(ctx, lines.join('\n'));
  await ctx.reply('Choose a plan to purchase:', {
    reply_markup: { inline_keyboard: buttons },
  });
};

/**
 * Callback query handler for buy:<planId> buttons.
 * Sends a Telegram Stars invoice directly in the chat.
 */
export const buyCallbackHandler = async (ctx) => {
  await ctx.answerCbQuery();

  const planId = parseInt(ctx.callbackQuery.data.split(':')[1], 10);
  if (!planId) return ctx.reply('❌ Invalid plan selection.');

  try {
    const { invoiceParams } = await starsPaymentService.createInvoice({
      telegramId: ctx.from.id,
      planId,
    });

    await ctx.replyWithInvoice(invoiceParams);
  } catch (err) {
    logger.error('Buy callback error', { telegramId: ctx.from?.id, planId, error: err.message });
    await ctx.reply(`❌ ${err.isOperational ? err.message : 'Could not create invoice. Please try again.'}`);
  }
};

export default buyCommand;
