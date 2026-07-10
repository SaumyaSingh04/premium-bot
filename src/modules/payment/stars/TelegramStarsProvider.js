import { IPaymentProvider } from '../IPaymentProvider.js';
import { PaymentError, PAYMENT_ERRORS } from '../paymentError.js';

/**
 * TelegramStarsProvider
 *
 * Implements IPaymentProvider for Telegram's native Stars (XTR) payment system.
 *
 * Telegram Stars flow:
 *   1. Bot sends an invoice via sendInvoice() with currency='XTR'
 *   2. Telegram sends a pre_checkout_query — bot must answer within 10 s
 *   3. On user confirmation, Telegram sends a successful_payment message
 *
 * This provider is stateless — it builds invoice params and parses
 * Telegram update payloads. All persistence is handled by StarsPaymentService.
 */
export class TelegramStarsProvider extends IPaymentProvider {
  get name() {
    return 'telegram_stars';
  }

  /**
   * Build the invoice parameters to pass to ctx.replyWithInvoice().
   * Stars invoices use currency='XTR' and prices in whole star units.
   *
   * @param {object} params
   * @param {string} params.title          Invoice title (max 32 chars)
   * @param {string} params.description    Invoice description (max 255 chars)
   * @param {string} params.payload        Bot-defined payload (planId:userId)
   * @param {number} params.starsAmount    Amount in Telegram Stars (XTR)
   * @returns {{ currency: string, prices: object[], payload: string, ... }}
   */
  buildInvoiceParams({ title, description, payload, starsAmount }) {
    if (!Number.isInteger(starsAmount) || starsAmount < 1) {
      throw new PaymentError(
        `Invalid starsAmount: ${starsAmount}. Must be a positive integer.`,
        PAYMENT_ERRORS.INVALID_PAYLOAD
      );
    }

    return {
      title: title.slice(0, 32),
      description: description.slice(0, 255),
      payload,
      currency: 'XTR',
      prices: [{ label: title.slice(0, 32), amount: starsAmount }],
      // Stars invoices must NOT include provider_token
    };
  }

  /**
   * Validate a pre_checkout_query.
   * Returns { ok: true } if the query is valid, throws PaymentError otherwise.
   *
   * @param {object} params
   * @param {import('telegraf').PreCheckoutQuery} params.query
   * @param {Function} params.getPlanByPayload  Async fn(payload) → CoinPlan|null
   */
  async validatePreCheckout({ query, getPlanByPayload }) {
    if (query.currency !== 'XTR') {
      throw new PaymentError(
        `Unexpected currency in pre_checkout: ${query.currency}`,
        PAYMENT_ERRORS.INVALID_PAYLOAD
      );
    }

    const plan = await getPlanByPayload(query.invoice_payload);
    if (!plan || !plan.isActive) {
      throw new PaymentError('Plan not found or inactive', PAYMENT_ERRORS.PLAN_NOT_FOUND);
    }

    if (query.total_amount !== plan.starsAmount) {
      throw new PaymentError(
        `Stars amount mismatch: expected ${plan.starsAmount}, got ${query.total_amount}`,
        PAYMENT_ERRORS.VERIFICATION_FAILED
      );
    }

    return { ok: true, plan };
  }

  /**
   * Parse a successful_payment message into a normalised result.
   *
   * @param {import('telegraf/types').SuccessfulPayment} payment  ctx.message.successful_payment
   * @returns {{ telegramChargeId: string, payload: string, starsAmount: number }}
   */
  parseSuccessfulPayment(payment) {
    const { telegram_payment_charge_id, invoice_payload, total_amount, currency } = payment;

    if (currency !== 'XTR') {
      throw new PaymentError(
        `Unexpected currency in successful_payment: ${currency}`,
        PAYMENT_ERRORS.INVALID_PAYLOAD
      );
    }

    return {
      telegramChargeId: telegram_payment_charge_id,
      payload: invoice_payload,
      starsAmount: total_amount,
    };
  }

  // ---------------------------------------------------------------------------
  // IPaymentProvider stubs — Stars does not use these paths
  // ---------------------------------------------------------------------------

  async createOrder() {
    throw new PaymentError(
      'TelegramStarsProvider does not support createOrder(). Use buildInvoiceParams() instead.',
      PAYMENT_ERRORS.PROVIDER_ERROR
    );
  }

  async verifyPayment() {
    throw new PaymentError(
      'TelegramStarsProvider does not support verifyPayment(). Use handleSuccessfulPayment() instead.',
      PAYMENT_ERRORS.PROVIDER_ERROR
    );
  }

  async parseWebhook() {
    throw new PaymentError(
      'TelegramStarsProvider does not use webhooks. Telegram pushes updates via the bot.',
      PAYMENT_ERRORS.PROVIDER_ERROR
    );
  }
}

export default new TelegramStarsProvider();
