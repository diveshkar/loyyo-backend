import * as posService from '../services/posToken.service.js';
import * as loyaltyService from '../services/loyalty.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/http.js';

export const rotatePosToken = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await posService.rotatePosToken({
    ownerId: authReq.user!._id,
  });
  sendSuccess(res, result);
});

export const validatePosToken = asyncHandler(async (req, res) => {
  const result = await posService.validatePosToken({
    token: req.body.token,
  });
  sendSuccess(res, result);
});

export const markVisit = asyncHandler(async (req, res) => {
  const shop   = (req as any).shop;
  const result = await loyaltyService.recordPosVisit({
    shopId:          shop._id,
    customerEmail:   req.body.customerEmail,
    serviceId:       req.body.serviceId,
    checkinToken:    req.body.checkinToken,
    spendAmount:     req.body.spendAmount,
    productsBought:  req.body.productsBought,
  });
  sendSuccess(res, result, 201);
});