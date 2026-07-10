import { Router } from 'express';
import { chat, clearHistory } from './chatController.js';
import { validate, chatSchema } from './chatValidator.js';

const router = Router();

router.post('/', validate(chatSchema), chat);
router.post('/clear', clearHistory);

export default router;
