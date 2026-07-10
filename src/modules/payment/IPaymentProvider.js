/**
 * IPaymentProvider — interface every gateway adapter must implement.
 *
 * Adapters (Razorpay, Stripe, TON, …) extend this class and override
 * all three methods. PaymentService depends only on this interface,
 * so swapping providers requires zero changes outside the adapter.
 */
export class IPaymentProvider {
  /** Human-readable provider name, e.g. 'razorpay' | 'stripe' | 'ton' */
  get name() {
    throw new Error(`${this.constructor.name} must implement get name()`);
  }

  /**
   * Create a payment order / checkout session with the gateway.
   *
   * @param {object} params
   * @param {number} params.amountUsd   Amount in USD
   * @param {number} params.coins       Coins being purchased (for metadata)
   * @param {number} params.userId      Internal user id (for metadata)
   * @param {number} params.planId      CoinPlan id (for metadata)
   * @returns {Promise<{ externalId: string, checkoutUrl: string, raw: object }>}
   */
  // eslint-disable-next-line no-unused-vars
  async createOrder(params) {
    throw new Error(`${this.constructor.name} must implement createOrder()`);
  }

  /**
   * Verify a payment after the user returns from the gateway.
   *
   * @param {object} params
   * @param {string} params.externalId   Gateway order / payment id
   * @param {string} [params.signature]  Signature string (Razorpay, etc.)
   * @param {object} [params.raw]        Any extra gateway-specific fields
   * @returns {Promise<{ verified: boolean, externalId: string }>}
   */
  // eslint-disable-next-line no-unused-vars
  async verifyPayment(params) {
    throw new Error(`${this.constructor.name} must implement verifyPayment()`);
  }

  /**
   * Parse and validate an inbound webhook payload from the gateway.
   *
   * @param {object} params
   * @param {object} params.body        Raw request body
   * @param {object} params.headers     Request headers (for signature verification)
   * @returns {Promise<{ externalId: string, status: 'COMPLETED'|'FAILED'|'REFUNDED', raw: object }>}
   */
  // eslint-disable-next-line no-unused-vars
  async parseWebhook(params) {
    throw new Error(`${this.constructor.name} must implement parseWebhook()`);
  }
}
