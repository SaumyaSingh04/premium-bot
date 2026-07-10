import { Router } from 'express';
import { getProfile, getStats } from './userController.js';

const router = Router();

router.get('/stats', getStats);
router.get('/:telegramId', getProfile);

export default router;
