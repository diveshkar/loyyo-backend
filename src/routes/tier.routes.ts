import { Router } from 'express';
import * as tierController from '../controllers/tier.controller.js';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import { tierStatusParamSchema } from '../validators/tier.schemas.js';

const router = Router();

router.use(protect, restrictTo('customer'));

router.get('/:shopId', validate({ params: tierStatusParamSchema }), tierController.getTierStatus);

export default router;
