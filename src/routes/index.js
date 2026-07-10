import { Router } from 'express';
import chatRoutes from '../modules/chat/chatRoutes.js';
import userRoutes from '../modules/user/userRoutes.js';
import walletRoutes from '../modules/wallet/walletRoutes.js';
import coinPlanRoutes from '../modules/coinPlan/coinPlanRoutes.js';
import paymentRoutes from '../modules/payment/paymentRoutes.js';
import { sendSuccess } from '../utils/response.js';

const router = Router();

router.get('/status', (req, res) => {
  sendSuccess(res, { status: 'running', timestamp: new Date().toISOString() }, 'Bot is running');
});

router.use('/chat', chatRoutes);
router.use('/users', userRoutes);
router.use('/wallet', walletRoutes);
router.use('/plans', coinPlanRoutes);
router.use('/payments', paymentRoutes);

// Future modules — uncomment when ready:
// router.use('/payments', paymentsRoutes);
// router.use('/ai', aiGenerationRoutes);

export default router;
