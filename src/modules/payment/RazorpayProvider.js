import Razorpay from 'razorpay';
import crypto from 'crypto';
import { IPaymentProvider } from './IPaymentProvider.js';
import { PaymentError, PAYMENT_ERRORS } from './paymentError.js';
import config from '../../config/index.js';

export class RazorpayProvider extends IPaymentProvider {
  constructor() {
    super();
    this._client = new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret,
    });
  }

  get name() {
    return 'razorpay';
  }

  /**
   * Create a Razorpay order.
   * Amount is converted from USD to smallest currency unit (paise for INR).
   * Razorpay does not return a hosted checkout URL — the client embeds the SDK.
   */
  async createOrder({ amountUsd, coins, userId, planId }) {
    const amountPaise = Math.round(amountUsd * 100); // USD → paise (assuming INR parity for demo)

    let order;
    try {
      order = await this._client.orders.create({
        amount: amountPaise,
        currency: 'INR',
        receipt: `plan_${planId}_user_${userId}`,
        notes: { userId: String(userId), planId: String(planId), coins: String(coins) },
      });
    } catch (err) {
      throw new PaymentError(
        `Razorpay order creation failed: ${err.error?.description ?? err.message}`,
        PAYMENT_ERRORS.PROVIDER_ERROR
      );
    }

    return {
      externalId: order.id,
      checkoutUrl: null, // Razorpay uses client-side SDK, not a redirect URL
      raw: order,
    };
  }

  /**
   * Verify payment signature after client-side checkout completes.
   * Razorpay signs: razorpay_order_id + '|' + razorpay_payment_id
   */
  async verifyPayment({ externalId, signature, raw }) {
    const { razorpay_payment_id: paymentId } = raw ?? {};

    if (!paymentId || !signature) {
      throw new PaymentError('Missing razorpay_payment_id or signature', PAYMENT_ERRORS.VERIFICATION_FAILED);
    }

    const expected = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(`${externalId}|${paymentId}`)
      .digest('hex');

    const verified = crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex')
    );

    return { verified, externalId };
  }

  /**
   * Parse and verify an inbound Razorpay webhook.
   * Razorpay signs the raw body with HMAC-SHA256 using the webhook secret.
   * The raw body MUST be passed as a Buffer (not parsed JSON).
   */
  async parseWebhook({ body, headers }) {
    const signature = headers['x-razorpay-signature'];
    if (!signature) {
      throw new PaymentError('Missing x-razorpay-signature header', PAYMENT_ERRORS.VERIFICATION_FAILED);
    }

    const rawBody = Buffer.isBuffer(body) ? body : Buffer.from(JSON.stringify(body));

    const expected = crypto
      .createHmac('sha256', config.razorpay.webhookSecret)
      .update(rawBody)
      .digest('hex');

    const valid = crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex')
    );

    if (!valid) {
      throw new PaymentError('Invalid Razorpay webhook signature', PAYMENT_ERRORS.VERIFICATION_FAILED);
    }

    const event = JSON.parse(rawBody.toString());
    const externalId = event?.payload?.payment?.entity?.order_id
      ?? event?.payload?.order?.entity?.id;

    const status = this._mapEventStatus(event.event);

    return { externalId, status, raw: event };
  }

  // ---------------------------------------------------------------------------

  _mapEventStatus(event) {
    if (!event) return null;
    if (event.startsWith('payment.captured') || event === 'order.paid') return 'COMPLETED';
    if (event.startsWith('payment.failed')) return 'FAILED';
    if (event.startsWith('refund.')) return 'REFUNDED';
    return null;
  }
}

export default new RazorpayProvider();
