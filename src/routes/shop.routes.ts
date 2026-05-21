import { Router } from 'express';
import * as shopController from '../controllers/shop.controller.js';
import * as memberController from '../controllers/member.controller.js';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import {
  shopMembersQuerySchema,
} from '../validators/member.schemas.js';
import {
  nearbyShopsQuerySchema,
  shopIdParamSchema,
  shopStatsQuerySchema,
  updateShopProfileSchema,
} from '../validators/shop.schemas.js';

const router = Router();

router.get('/nearby', protect, restrictTo('customer'), validate({ query: nearbyShopsQuerySchema }), shopController.getNearbyShops);
router.get('/me', protect, restrictTo('shop'), shopController.getCurrentShopProfile);
router.patch('/me', protect, restrictTo('shop'), validate({ body: updateShopProfileSchema }), shopController.updateCurrentShopProfile);
router.get('/me/stats', protect, restrictTo('shop'), validate({ query: shopStatsQuerySchema }), shopController.getShopStats);
router.get('/me/members', protect, restrictTo('shop'), validate({ query: shopMembersQuerySchema }), memberController.getShopMembers);
router.post('/me/api-token/rotate', protect, restrictTo('shop'), shopController.rotateShopApiToken);
router.get('/:id', validate({ params: shopIdParamSchema }), shopController.getPublicShopProfile);

export default router;
