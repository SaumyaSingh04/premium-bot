import paymentRepository from '../../../repositories/pg/pgPaymentRepository.js';
import coinPlanService from '../../coinPlan/coinPlanService.js';
import walletService from '../../wallet/walletService.js';
import userService from '../../user/userService.js';
import starsProvider from './TelegramStarsProvider.js';
import { PaymentError, PAYMENT_ERRORS } from '../paymentError.js';
import logger from '../../../logger/index.js';

/**
 * StarsPaymentService
 *
 * Orchestrates the full Telegram Stars payment lifecycle:
 *   createInvoice()          → build & return invoice params for the bot to send
 *   handlePreCheckout()      → validate pre_checkout_query, answer ok/error
 *   handleSuccessfulPayment()→ idempotent credit of coins after confirmed payment
 *   addCoins()               → atomic wallet credit + CoinTransaction record
 *   verifyPurchase()         → lookup a completed Stars payment by chargeId
 */
class StarsPaymentService {
  // ---------------------------------------------------------------------------
  // createInvoice
  // ---------------------------------------------------------------------------

  /**
   * Resolves the plan, builds invoice params, creates a PENDING payment record,
   * and returns everything the bot handler needs to call ctx.replyWithInvoice().
   *
   * @param {object} params
   * @param {number} params.telegramId   Telegram user id
   * @param {number} params.planId       CoinPlan id
   * @returns {Promise<{
   *   invoiceParams: object,
   *   payment: import('@prisma/client').Payment
   * }>}
   */
  async createInvoice({ telegramId, planId }) {
    const user = await userService.findByTelegramId(telegramId);
    if (!user) throw new PaymentError('User not found', PAYMENT_ERRORS.USER_NOT_FOUND);

    const plan = await coinPlanService.getPlanById(planId);
    if (!plan || !plan.isActive) {
      throw new PaymentError('Plan not found or inactive', PAYMENT_ERRORS.PLAN_NOT_FOUND);
    }

    if (!plan.starsAmount || plan.starsAmount < 1) {
      throw new PaymentError(
        `Plan "${plan.name}" has no Stars price configured`,
        PAYMENT_ERRORS.INVALID_PAYLOAD
      );
    }

    // Payload encodes planId + userId for verification at pre-checkout
    const payload = this._buildPayload(plan.id, user.id);

    const invoiceParams = starsProvider.buildInvoiceParams({
      title: plan.name,
      description: `${plan.coins} coins for ${plan.starsAmount} ⭐`,
      payload,
      starsAmount: plan.starsAmount,
    });

    // Create a PENDING record so we can track the invoice before payment
    const payment = await paymentRepository.create({
      userId: user.id,
      planId: plan.id,
      provider: 'TELEGRAM_STARS',
      amountUsd: plan.priceUsd,
      coins: plan.coins,
      starsAmount: plan.starsAmount,
      externalId: payload, // used as a lookup key before chargeId is known
    });

    logger.info('Stars invoice created', {
      paymentId: payment.id,
      userId: user.id,
      planId: plan.id,
      starsAmount: plan.starsAmount,
    });

    return { invoiceParams, payment };
  }

  // ---------------------------------------------------------------------------
  // handlePreCheckout
  // ---------------------------------------------------------------------------

  /**
   * Validates a pre_checkout_query and answers Telegram within the 10-second window.
   * Must be called from the bot's pre_checkout_query handler.
   *
   * @param {import('telegraf').Context} ctx
   * @returns {Promise<void>}
   */
  async handlePreCheckout(ctx) {
    const query = ctx.preCheckoutQuery;

    try {
      await starsProvider.validatePreCheckout({
        query,
        getPlanByPayload: (payload) => this._getPlanFromPayload(payload),
      });

      await ctx.answerPreCheckoutQuery(true);

      logger.info('Pre-checkout approved', {
        telegramId: query.from.id,
        payload: query.invoice_payload,
        starsAmount: query.total_amount,
      });
    } catch (err) {
      // Must always answer — even on error — or Telegram will show a generic failure
      await ctx.answerPreCheckoutQuery(false, err.message).catch(() => {});

      logger.warn('Pre-checkout rejected', {
        telegramId: query.from.id,
        reason: err.message,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // handleSuccessfulPayment
  // ---------------------------------------------------------------------------

  /**
   * Processes a confirmed successful_payment update.
   * Idempotent — safe to call multiple times for the same charge.
   *
   * @param {import('telegraf').Context} ctx
   * @returns {Promise<{
   *   payment: import('@prisma/client').Payment,
   *   coinsAdded: number,
   *   alreadyProcessed: boolean
   * }>}
   */
  async handleSuccessfulPayment(ctx) {
    const raw = ctx.message.successful_payment;
    const telegramId = ctx.from.id;

    const { telegramChargeId, payload, starsAmount } = starsProvider.parseSuccessfulPayment(raw);

    // Idempotency — guard against duplicate Telegram delivery
    const existing = await paymentRepository.findByTelegramChargeId(telegramChargeId);
    if (existing?.status === 'COMPLETED') {
      logger.info('Stars payment already processed (idempotent)', { telegramChargeId });
      return { payment: existing, coinsAdded: 0, alreadyProcessed: true };
    }

    const user = await userService.findByTelegramId(telegramId);
    if (!user) throw new PaymentError('User not found', PAYMENT_ERRORS.USER_NOT_FOUND);

    const plan = await this._getPlanFromPayload(payload);
    if (!plan) throw new PaymentError('Plan not found for payload', PAYMENT_ERRORS.PLAN_NOT_FOUND);

    // Find the PENDING payment created at invoice time, or create one if missing
    let payment = await paymentRepository.findByExternalId(payload);
    if (!payment) {
      payment = await paymentRepository.create({
        userId: user.id,
        planId: plan.id,
        provider: 'TELEGRAM_STARS',
        amountUsd: plan.priceUsd,
        coins: plan.coins,
        starsAmount,
        externalId: payload,
        telegramChargeId,
      });
    }

    // Mark completed and stamp the charge id
    const completed = await paymentRepository.update(payment.id, {
      status: 'COMPLETED',
      telegramChargeId,
      starsAmount,
      completedAt: new Date(),
      webhookPayload: raw,
    });

    // Credit coins atomically
    const { wallet } = await this.addCoins({
      userId: user.id,
      coins: plan.coins,
      paymentId: payment.id,
      planName: plan.name,
    });

    logger.info('Stars payment completed — coins credited', {
      telegramId,
      paymentId: payment.id,
      telegramChargeId,
      coins: plan.coins,
      balanceAfter: wallet.balance,
    });

    return { payment: completed, coinsAdded: plan.coins, alreadyProcessed: false };
  }

  // ---------------------------------------------------------------------------
  // addCoins
  // ---------------------------------------------------------------------------

  /**
   * Atomically credits coins to the user's wallet and records a CoinTransaction.
   * Delegates to walletService — this method is a named, documented entry point.
   *
   * @param {object} params
   * @param {number} params.userId
   * @param {number} params.coins
   * @param {number} params.paymentId
   * @param {string} params.planName
   * @returns {Promise<{ wallet: object, transaction: object }>}
   */
  addCoins({ userId, coins, paymentId, planName }) {
    return walletService.addCoins(userId, coins, {
      type: 'TOPUP',
      note: `Stars purchase: ${planName}`,
      refId: String(paymentId),
    });
  }

  // ---------------------------------------------------------------------------
  // verifyPurchase
  // ---------------------------------------------------------------------------

  /**
   * Looks up a completed Stars payment by its Telegram charge id.
   * Use this to confirm a purchase from the REST API or admin tools.
   *
   * @param {string} telegramChargeId
   * @returns {Promise<import('@prisma/client').Payment>}
   */
  async verifyPurchase(telegramChargeId) {
    const payment = await paymentRepository.findByTelegramChargeId(telegramChargeId);
    if (!payment) {
      throw new PaymentError('Payment not found', PAYMENT_ERRORS.PAYMENT_NOT_FOUND);
    }
    if (payment.status !== 'COMPLETED') {
      throw new PaymentError(
        `Payment is not completed (status: ${payment.status})`,
        PAYMENT_ERRORS.VERIFICATION_FAILED
      );
    }
    return payment;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /** Encode planId + userId into a compact, reversible payload string */
  _buildPayload(planId, userId) {
    return `stars:${planId}:${userId}`;
  }

  /** Decode payload and return the CoinPlan, or null if invalid */
  async _getPlanFromPayload(payload) {
    if (!payload?.startsWith('stars:')) return null;
    const [, planIdStr] = payload.split(':');
    const planId = parseInt(planIdStr, 10);
    if (!planId) return null;
    return coinPlanService.getPlanById(planId);
  }
}

export default new StarsPaymentService();
