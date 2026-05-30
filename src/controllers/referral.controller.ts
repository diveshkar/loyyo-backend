import * as referralService from '../services/referral.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/http.js';

export const generateReferralCode = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await referralService.generateReferralCode({
    customerId: authReq.user!._id,
    shopId:     String(req.params.shopId),
  });
  sendSuccess(res, result, 201);
});

export const applyReferralCode = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await referralService.applyReferralCode({
    code:          req.body.code,
    newCustomerId: authReq.user!._id,
  });
  sendSuccess(res, result);
});

export const getReferrals = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await referralService.getReferrals({
    customerId: authReq.user!._id,
    shopId:     req.query.shopId as string | undefined,
    page:       Number(req.query.page),
    limit:      Number(req.query.limit),
  });
  sendSuccess(res, result);
});