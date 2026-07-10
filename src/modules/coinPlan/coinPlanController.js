import coinPlanService from './coinPlanService.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { HTTP_STATUS } from '../../constants/index.js';

// GET /api/v1/plans
export const getPlans = asyncHandler(async (req, res) => {
  const onlyActive = req.query.all !== 'true';
  const plans = await coinPlanService.getPlans(onlyActive);
  sendSuccess(res, { plans });
});

// GET /api/v1/plans/:id
export const getPlanById = asyncHandler(async (req, res) => {
  const plan = await coinPlanService.getPlanById(Number(req.params.id));
  if (!plan) return sendError(res, 'Plan not found', HTTP_STATUS.NOT_FOUND);
  sendSuccess(res, { plan });
});

// POST /api/v1/plans
export const createPlan = asyncHandler(async (req, res) => {
  const { name, coins, priceUsd, stripePriceId, isActive, sortOrder } = req.body;
  const plan = await coinPlanService.createPlan({ name, coins, priceUsd, stripePriceId, isActive, sortOrder });
  sendSuccess(res, { plan }, 'Plan created', HTTP_STATUS.CREATED);
});

// PATCH /api/v1/plans/:id
export const updatePlan = asyncHandler(async (req, res) => {
  const plan = await coinPlanService.updatePlan(Number(req.params.id), req.body);
  sendSuccess(res, { plan }, 'Plan updated');
});

// PATCH /api/v1/plans/:id/active
export const setPlanActive = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const plan = await coinPlanService.setPlanActive(Number(req.params.id), Boolean(isActive));
  sendSuccess(res, { plan }, 'Plan status updated');
});
