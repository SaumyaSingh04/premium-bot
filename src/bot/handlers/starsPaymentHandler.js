import starsPaymentService from '../../modules/payment/stars/starsPaymentService.js';
import logger from '../../logger/index.js';

/**
 * pre_checkout_query handler.
 * Telegram requires a response within 10 seconds — starsPaymentService handles
 * both the ok and error answer paths internally.
 */
export const preCheckoutHandler = async (ctx) => {
  await starsPaymentService.handlePreCheckout(ctx);
};

/**
 * successful_payment handler.
 * Fires after Telegram confirms the user completed the Stars payment.
 * Credits coins and notifies the user.
 */
export const successfulPaymentHandler = async (ctx) => {
  try {
    const { coinsAdded, alreadyProcessed } = await starsPaymentService.handleSuccessfulPayment(ctx);

    if (alreadyProcessed) {
      return ctx.reply('✅ Your purchase was already processed. Check /balance.');
    }

    await ctx.reply(
      `🎉 Payment successful!\n\n` +
      `• *${coinsAdded} coins* have been added to your wallet.\n` +
      `• Use /balance to check your balance.`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    logger.error('Stars successful_payment handler error', {
      telegramId: ctx.from?.id,
      error: err.message,
      stack: err.stack,
    });
    await ctx.reply('❌ Something went wrong processing your payment. Please contact support.').catch(() => {});
  }
};
