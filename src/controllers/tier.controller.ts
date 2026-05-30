import * as tierService from '../services/tier.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/http.js';

export const getTierStatus = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await tierService.getTierStatus({
    customerId: authReq.user!._id,
    shopId:     String(req.params.shopId),
  });
  sendSuccess(res, result);
});
