import { Router } from 'express';
import {
  getBalance,
  getTransactions,
  addCoins,
  deductCoins,
  validateBalance,
} from './walletController.js';

const router = Router({ mergeParams: true });

router.get('/:telegramId/balance', getBalance);
router.get('/:telegramId/transactions', getTransactions);
router.get('/:telegramId/validate', validateBalance);
router.post('/:telegramId/add', addCoins);
router.post('/:telegramId/deduct', deductCoins);

export default router;
