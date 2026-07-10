import { Router } from 'express';
import { getPlans, getPlanById, createPlan, updatePlan, setPlanActive } from './coinPlanController.js';

const router = Router();

router.get('/', getPlans);
router.get('/:id', getPlanById);
router.post('/', createPlan);
router.patch('/:id', updatePlan);
router.patch('/:id/active', setPlanActive);

export default router;
