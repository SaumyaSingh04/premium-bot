import User from '../models/User.js';
import config from '../config/index.js';

const startOfTodayUTC = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

class CreditsRepository {
  async getCredits(telegramId) {
    const user = await User.findOne({ telegramId }, 'credits');
    if (!user) return config.credits.dailyFree;

    const today = startOfTodayUTC();
    if (user.credits.lastResetAt < today) {
      const updated = await User.findOneAndUpdate(
        { telegramId },
        { $set: { 'credits.remaining': config.credits.dailyFree, 'credits.lastResetAt': new Date() } },
        { new: true }
      );
      return updated.credits.remaining;
    }

    return user.credits.remaining;
  }

  /**
   * Atomically resets credits if a new day has started, then deducts.
   * Single round-trip using an aggregation pipeline update — eliminates TOCTOU.
   * Returns true if deduction succeeded, false if insufficient credits.
   */
  async deduct(telegramId, amount = 1) {
    const today = startOfTodayUTC();

    // Pipeline update: reset if lastResetAt < today, then deduct if remaining >= amount
    const updated = await User.findOneAndUpdate(
      { telegramId },
      [
        {
          $set: {
            'credits.remaining': {
              $cond: {
                if: { $lt: ['$credits.lastResetAt', today] },
                then: config.credits.dailyFree,
                else: '$credits.remaining',
              },
            },
            'credits.lastResetAt': {
              $cond: {
                if: { $lt: ['$credits.lastResetAt', today] },
                then: new Date(),
                else: '$credits.lastResetAt',
              },
            },
          },
        },
        {
          $set: {
            'credits.remaining': {
              $cond: {
                if: { $gte: ['$credits.remaining', amount] },
                then: { $subtract: ['$credits.remaining', amount] },
                else: '$credits.remaining',
              },
            },
          },
        },
      ],
      { new: false } // return doc BEFORE update so we can check if deduction was possible
    );

    if (!updated) return false;

    // Deduction succeeded if the pre-update remaining was >= amount
    // (after potential reset, which we can infer from lastResetAt)
    const wasReset = updated.credits.lastResetAt < today;
    const effectiveBalance = wasReset ? config.credits.dailyFree : updated.credits.remaining;
    return effectiveBalance >= amount;
  }
}

export default new CreditsRepository();
