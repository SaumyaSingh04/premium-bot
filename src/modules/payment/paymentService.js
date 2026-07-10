import paymentRepository from '../../repositories/pg/pgPaymentRepository.js';
import coinPlanService from '../coinPlan/coinPlanService.js';
import walletService from '../wallet/walletService.js';
import userService from '../user/userService.js';
import logger from '../../logger/index.js';
import { PaymentError, PAYMENT_ERRORS } from './paymentError.js';

class PaymentService {
  /** @type {Map<string, import('./IPaymentProvider.js').IPaymentProvider>} */
  #providers = new Map();

  /**
   * Register a gateway adapter.
   * @param {import('./IPaymentProvider.js').IPaymentProvider} provider
   */
  registerProvider(provider) {
    this.#providers.set(provider.name, provider);
  }

  /**
   * @param {string} name
   * @returns {import('./IPaymentProvider.js').IPaymentProvider}
   */
  #getProvider(name) {
    const provider = this.#providers.get(name);
    if (!provider) {
      throw new PaymentError(`Payment provider "${name}" is not registered`, PAYMENT_ERRORS.PROVIDER_ERROR);
    }
    return provider;
  }

  // ---------------------------------------------------------------------------
  // createOrder
  // ---------------------------------------------------------------------------

  /**
   * Creates a pending Payment record and delegates order creation to the provider.
   *
   * @param {object} params
   * @param {number} params.telegramId
   * @param {number} params.planId
   * @param {string} params.provider   e.g. 'razorpay' | 'stripe'
   * @returns {Promise<{ payment: object, checkoutUrl: string }>}
   */
  async createOrder({ telegramId, planId, provider: providerName }) {
    const user = await userService.findByTelegramId(telegramId);
    if (!user) throw new PaymentError('User not found', PAYMENT_ERRORS.USER_NOT_FOUND);

    const plan = await coinPlanService.getPlanById(planId);
    if (!plan || !plan.isActive) throw new PaymentError('Plan not found or inactive', PAYMENT_ERRORS.PLAN_NOT_FOUND);

    const provider = this.#getProvider(providerName);

    const { externalId, checkoutUrl, raw } = await provider.createOrder({
      amountUsd: plan.priceUsd,
      coins: plan.coins,
      userId: user.id,
      planId: plan.id,
    });

    const payment = await paymentRepository.create({
      userId: user.id,
      planId: plan.id,
      provider: providerName.toUpperCase(),
      amountUsd: plan.priceUsd,
      coins: plan.coins,
      externalId,
      checkoutUrl,
      webhookPayload: raw ?? undefined,
    });

    logger.info('Payment order created', { paymentId: payment.id, provider: providerName, planId });

    return { payment, checkoutUrl };
  }

  // ---------------------------------------------------------------------------
  // verifyPayment
  // ---------------------------------------------------------------------------

  /**
   * Verifies a payment after user returns from the gateway checkout.
   * On success, credits coins to the user's wallet.
   *
   * @param {object} params
   * @param {number} params.paymentId   Internal payment record id
   * @param {string} params.externalId  Gateway order / payment id
   * @param {string} [params.signature]
   * @param {object} [params.raw]
   * @returns {Promise<{ payment: object, coinsAdded: number }>}
   */
  async verifyPayment({ paymentId, externalId, signature, raw }) {
    const payment = await paymentRepository.findById(paymentId);
    if (!payment) throw new PaymentError('Payment not found', PAYMENT_ERRORS.PAYMENT_NOT_FOUND);
    if (payment.status === 'COMPLETED') throw new PaymentError('Payment already completed', PAYMENT_ERRORS.ALREADY_COMPLETED);

    const provider = this.#getProvider(payment.provider.toLowerCase());

    const { verified } = await provider.verifyPayment({ externalId, signature, raw });
    if (!verified) throw new PaymentError('Payment verification failed', PAYMENT_ERRORS.VERIFICATION_FAILED);

    const updated = await paymentRepository.markCompleted(payment.id, externalId);

    await walletService.addCoins(payment.userId, payment.coins, {
      type: 'TOPUP',
      note: `Plan purchase: ${payment.plan.name}`,
      refId: String(payment.id),
    });

    logger.info('Payment verified and coins credited', {
      paymentId: payment.id,
      userId: payment.userId,
      coins: payment.coins,
    });

    return { payment: updated, coinsAdded: payment.coins };
  }

  // ---------------------------------------------------------------------------
  // webhook
  // ---------------------------------------------------------------------------

  /**
   * Handles an inbound webhook from a payment gateway.
   * Idempotent — skips already-completed payments.
   *
   * @param {object} params
   * @param {string} params.providerName
   * @param {object} params.body
   * @param {object} params.headers
   * @returns {Promise<{ handled: boolean, paymentId: number|null }>}
   */
  async webhook({ providerName, body, headers }) {
    const provider = this.#getProvider(providerName);

    const { externalId, status, raw } = await provider.parseWebhook({ body, headers });

    const payment = await paymentRepository.findByExternalId(externalId);
    if (!payment) {
      logger.warn('Webhook received for unknown externalId', { externalId, providerName });
      return { handled: false, paymentId: null };
    }

    await paymentRepository.saveWebhookPayload(payment.id, raw);

    if (payment.status === 'COMPLETED') {
      return { handled: true, paymentId: payment.id };
    }

    if (status === 'COMPLETED') {
      await paymentRepository.markCompleted(payment.id, externalId);
      await walletService.addCoins(payment.userId, payment.coins, {
        type: 'TOPUP',
        note: `Webhook: plan purchase confirmed`,
        refId: String(payment.id),
      });
      logger.info('Coins credited via webhook', { paymentId: payment.id, coins: payment.coins });
    } else if (status === 'FAILED') {
      await paymentRepository.markFailed(payment.id);
    } else if (status === 'REFUNDED') {
      await paymentRepository.markRefunded(payment.id);
    }

    return { handled: true, paymentId: payment.id };
  }
}

export default new PaymentService();
