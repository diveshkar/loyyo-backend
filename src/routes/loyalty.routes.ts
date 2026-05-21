import { Router } from 'express';
import * as loyaltyController from '../controllers/loyalty.controller.js';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import {
  loyaltyRuleSchema,
  markVisitSchema,
  visitHistoryParamSchema,
  visitHistoryQuerySchema,
} from '../validators/loyalty.schemas.js';

const router = Router();

router.post('/rules', protect, restrictTo('shop'), validate({ body: loyaltyRuleSchema }), loyaltyController.createOrUpdateRule);
router.post('/visit', protect, restrictTo('shop'), validate({ body: markVisitSchema }), loyaltyController.markVisit);
router.get('/history/:memId', protect, restrictTo('shop'), validate({ params: visitHistoryParamSchema, query: visitHistoryQuerySchema }), loyaltyController.getVisitHistory);

export default router;
