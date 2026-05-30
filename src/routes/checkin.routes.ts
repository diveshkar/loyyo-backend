import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import {
  generateOrderCodeSchema,
  verifyOrderCodeSchema,
  verifyTokenBodySchema,
} from '../validators/checkin.schemas.js';
import * as checkinController from '../controllers/checkin.controller.js';

const router = Router();

// ── customer routes ───────────────────────────────────────────────────────────
router.post('/token',              protect, restrictTo('customer'), checkinController.generateCheckinToken);
router.post('/order-code',         protect, restrictTo('customer'), validate({ body: generateOrderCodeSchema }), checkinController.generateOrderCode);

// ── shop routes ───────────────────────────────────────────────────────────────
router.post('/verify',             protect, restrictTo('shop'),     validate({ body: verifyTokenBodySchema }),    checkinController.verifyCheckinToken);
router.post('/order-code/verify',  protect, restrictTo('shop'),     validate({ body: verifyOrderCodeSchema }),    checkinController.verifyOrderCode);

export default router;