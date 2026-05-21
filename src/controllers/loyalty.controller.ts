import * as loyaltyService from '../services/loyalty.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/http.js';

export const createOrUpdateRule = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await loyaltyService.createOrUpdateRuleForOwner({
    ownerId: authReq.user!._id,
    title: req.body.title,
    visitsRequired: req.body.visitsRequired,
    rewardDescription: req.body.rewardDescription,
  });
  sendSuccess(res, result, 201);
});

export const markVisit = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await loyaltyService.recordVisitForOwner({
    ownerId: authReq.user!._id,
    customerEmail: req.body.customerEmail,
  });
  sendSuccess(res, result, 201);
});

export const getVisitHistory = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await loyaltyService.getVisitHistory({
    membershipId: String(req.params.memId),
    requesterId: authReq.user!._id,
    page: Number(req.query.page),
    limit: Number(req.query.limit),
  });
  sendSuccess(res, result);
});
