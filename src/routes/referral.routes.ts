import { Router } from 'express';
import * as referralController from '../controllers/referral.controller.js';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import {
  applyReferralCodeSchema,
  generateReferralCodeSchema,
  referralsQuerySchema,
} from '../validators/referral.schemas.js';

const router = Router();

// ── customer routes ───────────────────────────────────────────────────────────
router.post('/generate/:shopId', protect, restrictTo('customer'), validate({ params: generateReferralCodeSchema }), referralController.generateReferralCode);
router.post('/apply',            protect, restrictTo('customer'), validate({ body: applyReferralCodeSchema }),       referralController.applyReferralCode);
router.get('/',                  protect, restrictTo('customer'), validate({ query: referralsQuerySchema }),         referralController.getReferrals);

export default router;