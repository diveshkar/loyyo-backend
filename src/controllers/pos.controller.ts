import * as loyaltyService from '../services/loyalty.service.js';
import type { PosAuthenticatedRequest } from '../middleware/posAuth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/http.js';

export const markVisit = asyncHandler(async (req, res) => {
  const posReq = req as PosAuthenticatedRequest;
  const result = await loyaltyService.recordPosVisit({
    shopId: posReq.shop!._id,
    markedById: posReq.shop!.ownerId,
    customerEmail: req.body.customerEmail,
  });
  sendSuccess(res, result, 201);
});
