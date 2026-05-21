import { Router } from 'express';
import * as rewardController from '../controllers/reward.controller.js';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import { rewardIdParamSchema } from '../validators/reward.schemas.js';

const router = Router();

router.post('/redeem/:rewardId', protect, restrictTo('shop'), validate({ params: rewardIdParamSchema }), rewardController.redeemReward);

export default router;
