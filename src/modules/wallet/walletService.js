import prisma from '../../config/prisma.js';
import pgWalletRepository from '../../repositories/pg/pgWalletRepository.js';
import { WalletError, WALLET_ERRORS } from './walletError.js';
import logger from '../../logger/index.js';

class WalletService {
  /**
   * Resolve wallet by userId, throw WalletError if not found.
   * Accepts an optional tx (Prisma transaction client) for atomic operations.
   * @private
   */
  async _requireWallet(userId, tx = null) {
    const wallet = tx
      ? await tx.wallet.findUnique({ where: { userId } })
      : await pgWalletRepository.findByUserId(userId);
    if (!wallet) {
      throw new WalletError(`Wallet not found for userId ${userId}`, WALLET_ERRORS.NOT_FOUND);
    }
    return wallet;
  }

  /** @private */
  _requirePositiveAmount(amount) {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new WalletError(
        `Amount must be a positive integer, got: ${amount}`,
        WALLET_ERRORS.INVALID_AMOUNT
      );
    }
  }

  async getBalance(userId) {
    const wallet = await this._requireWallet(userId);
    return wallet.balance;
  }

  async validateBalance(userId, amount) {
    this._requirePositiveAmount(amount);
    const wallet = await this._requireWallet(userId);
    const valid = wallet.balance >= amount;
    return { valid, balance: wallet.balance, shortfall: valid ? 0 : amount - wallet.balance };
  }

  async addCoins(userId, amount, { type, note, refId } = {}) {
    this._requirePositiveAmount(amount);

    const result = await prisma.$transaction(async (tx) => {
      const wallet = await this._requireWallet(userId, tx);

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      });

      const transaction = await tx.coinTransaction.create({
        data: {
          userId,
          walletId: wallet.id,
          type,
          amount,
          balanceAfter: updatedWallet.balance,
          note: note ?? null,
          refId: refId ?? null,
        },
      });

      return { wallet: updatedWallet, transaction };
    });

    logger.info('Coins added', { userId, amount, type, balanceAfter: result.wallet.balance });
    return result;
  }

  async deductCoins(userId, amount, { type, note, refId } = {}) {
    this._requirePositiveAmount(amount);

    const result = await prisma.$transaction(async (tx) => {
      const wallet = await this._requireWallet(userId, tx);

      if (wallet.balance < amount) {
        throw new WalletError(
          `Insufficient balance: has ${wallet.balance}, needs ${amount}`,
          WALLET_ERRORS.INSUFFICIENT_BALANCE
        );
      }

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      });

      const transaction = await tx.coinTransaction.create({
        data: {
          userId,
          walletId: wallet.id,
          type,
          amount: -amount,
          balanceAfter: updatedWallet.balance,
          note: note ?? null,
          refId: refId ?? null,
        },
      });

      return { wallet: updatedWallet, transaction };
    });

    logger.info('Coins deducted', { userId, amount, type, balanceAfter: result.wallet.balance });
    return result;
  }

  getTransactions(userId, limit = 20, offset = 0) {
    return prisma.coinTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }
}

export default new WalletService();
