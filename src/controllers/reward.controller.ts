import * as rewardService from '../services/reward.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/http.js';

export const redeemReward = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await rewardService.redeemReward({
    rewardId: String(req.params.rewardId),
    ownerId: authReq.user!._id,
  });
  sendSuccess(res, result);
});
