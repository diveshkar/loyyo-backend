import * as memberService from '../services/member.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/http.js';

export const joinShop = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await memberService.joinShop({
    customerId: authReq.user!._id,
    shopId: String(req.params.shopId),
  });
  sendSuccess(res, result, 201);
});

export const getCustomerMemberships = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await memberService.getCustomerMemberships({
    customerId: authReq.user!._id,
    page: Number(req.query.page),
    limit: Number(req.query.limit),
  });
  sendSuccess(res, result);
});

export const getCustomerMembership = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await memberService.getCustomerMembership({
    customerId: authReq.user!._id,
    shopId: String(req.params.shopId),
  });
  sendSuccess(res, result);
});

export const getShopMembers = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await memberService.getShopMembers({
    ownerId: authReq.user!._id,
    search: req.query.search as string | undefined,
    page: Number(req.query.page),
    limit: Number(req.query.limit),
  });
  sendSuccess(res, result);
});
