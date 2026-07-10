import { Router } from 'express';
import { createOrder, verifyPayment, webhook, getHistory } from './paymentController.js';

const router = Router();

router.post('/order', createOrder);
router.post('/verify', verifyPayment);
router.post('/webhook/:provider', webhook);
router.get('/:telegramId/history', getHistory);

export default router;
