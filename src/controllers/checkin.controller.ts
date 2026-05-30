import * as checkinService from '../services/checkin.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/http.js';

export const generateCheckinToken = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await checkinService.generateCheckinToken({
    customerId: authReq.user!._id,
  });
  sendSuccess(res, result, 201);
});

export const generateOrderCode = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await checkinService.generateOrderCode({
    customerId: authReq.user!._id,
    shopId:     req.body.shopId,
  });
  sendSuccess(res, result, 201);
});

export const verifyCheckinToken = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await checkinService.verifyCheckinToken({
    token:           req.body.token,
    shopId:          authReq.user!._id,
    usedByDevice:    req.body.usedByDevice,
    serviceId:       req.body.serviceId,
    spendAmount:     req.body.spendAmount,
    productsBought:  req.body.productsBought,
  });
  sendSuccess(res, result);
});

export const verifyOrderCode = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await checkinService.verifyOrderCode({
    orderCode:       req.body.orderCode,
    shopId:          authReq.user!._id,
    serviceId:       req.body.serviceId,
    spendAmount:     req.body.spendAmount,
    productsBought:  req.body.productsBought,
  });
  sendSuccess(res, result);
});