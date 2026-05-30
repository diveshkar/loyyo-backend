import { Router } from 'express';
import * as pointsController from '../controllers/points.controller.js';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import {
  pointsBalanceParamSchema,
  pointsHistoryQuerySchema,
} from '../validators/points.schemas.js';

const router = Router();

router.use(protect, restrictTo('customer'));

router.get('/history',          validate({ query: pointsHistoryQuerySchema }),  pointsController.getPointsHistory);
router.get('/balance/:shopId',  validate({ params: pointsBalanceParamSchema }), pointsController.getPointsBalance);

export default router;
