import * as pointsService from '../services/points.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/http.js';

export const getPointsHistory = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await pointsService.getPointsHistory({
    customerId: authReq.user!._id,
    shopId:     req.query.shopId as string | undefined,
    page:       Number(req.query.page)  || undefined,
    limit:      Number(req.query.limit) || undefined,
  });
  sendSuccess(res, result);
});

export const getPointsBalance = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await pointsService.getPointsBalance({
    customerId: authReq.user!._id,
    shopId:     String(req.params.shopId),
  });
  sendSuccess(res, result);
});
