import { Router } from 'express';
import * as shopController from '../controllers/shop.controller.js';
import * as memberController from '../controllers/member.controller.js';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import {
  createServiceSchema,
  nearbyShopsQuerySchema,
  searchShopsToJoinQuerySchema,
  serviceIdParamSchema,
  shopIdParamSchema,
  shopStatsQuerySchema,
  updateServiceSchema,
  updateShopProfileSchema,
} from '../validators/shop.schemas.js';
import { shopMembersQuerySchema } from '../validators/loyalty.schemas.js';

const router = Router();

// ── static /me routes first ────────────────────────────────────────────────
router.get('/me', protect, restrictTo('shop'), shopController.getCurrentShopProfile);
router.patch('/me', protect, restrictTo('shop'), validate({ body: updateShopProfileSchema }), shopController.updateCurrentShopProfile);
router.get('/me/stats', protect, restrictTo('shop'), validate({ query: shopStatsQuerySchema }), shopController.getShopStats);
router.get('/me/members', protect, restrictTo('shop'), validate({ query: shopMembersQuerySchema }), memberController.getShopMembers);
router.get('/me/subscription', protect, restrictTo('shop'), shopController.getSubscriptionStatus);
router.get('/me/poster-usage', protect, restrictTo('shop'), shopController.getPosterUsageStatus);
router.post('/me/api-token/rotate', protect, restrictTo('shop'), shopController.rotateShopApiToken);
router.get('/me/services', protect, restrictTo('shop'), shopController.getServiceList);
router.post('/me/services', protect, restrictTo('shop'), validate({ body: createServiceSchema }), shopController.createService);
router.patch('/me/services/:serviceId', protect, restrictTo('shop'), validate({ params: serviceIdParamSchema, body: updateServiceSchema }), shopController.updateService);
router.delete('/me/services/:serviceId', protect, restrictTo('shop'), validate({ params: serviceIdParamSchema }), shopController.deleteService);

// ── static non-me routes before /:id ──────────────────────────────────────
router.get('/nearby', protect, restrictTo('customer'), validate({ query: nearbyShopsQuerySchema }), shopController.getNearbyShops);
router.get('/search', protect, restrictTo('customer'), validate({ query: searchShopsToJoinQuerySchema }), shopController.searchShopsToJoin);

// ── dynamic param route last ───────────────────────────────────────────────
router.get('/:id', validate({ params: shopIdParamSchema }), shopController.getPublicShopProfile);

export default router;