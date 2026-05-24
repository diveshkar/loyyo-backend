import * as loyaltyService from '../services/loyalty.service.js';
import type { PosAuthenticatedRequest } from '../middleware/posAuth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/http.js';

export const markVisit = asyncHandler(async (req, res) => {
  const posReq = req as PosAuthenticatedRequest;
  const result = await loyaltyService.recordPosVisit({
    shopId: posReq.shop!._id,
    customerEmail: req.body.customerEmail,
    serviceId: req.body.serviceId,
    checkinToken: req.body.checkinToken,
    locationVerified: req.body.locationVerified,
    spendAmount: req.body.spendAmount,
    productsBought: req.body.productsBought,
  });
  sendSuccess(res, result, 201);
});
