import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import {
  adminAdIdParamSchema,
  adminAdsQuerySchema,
  adminListShopsQuerySchema,
  adminPaymentsQuerySchema,
  adminShopIdParamSchema,
  adminUsersQuerySchema,
  approveAdSchema,
  auditLogsQuerySchema,
  pauseAdSchema,
  removeAdSchema,
  suspendShopSchema,
} from '../validators/admin.schemas.js';

const router = Router();

router.use(protect, restrictTo('admin'));

router.get('/shops',                  validate({ query: adminListShopsQuerySchema }),                                   adminController.getAdminShops);
router.patch('/shops/:id/approve',    validate({ params: adminShopIdParamSchema }),                                     adminController.approveShop);
router.patch('/shops/:id/suspend',    validate({ params: adminShopIdParamSchema, body: suspendShopSchema }),            adminController.suspendShop);
router.patch('/shops/:id/reinstate',  validate({ params: adminShopIdParamSchema }),                                     adminController.reinstateShop);
router.get('/users',                  validate({ query: adminUsersQuerySchema }),                                       adminController.getAdminUsers);
router.get('/payments',               validate({ query: adminPaymentsQuerySchema }),                                    adminController.getAdminPayments);
router.get('/ads',                    validate({ query: adminAdsQuerySchema }),                                         adminController.getAdminAds);
router.patch('/ads/:id/approve',      validate({ params: adminAdIdParamSchema, body: approveAdSchema }),                adminController.approveAd);
router.patch('/ads/:id/pause',        validate({ params: adminAdIdParamSchema, body: pauseAdSchema }),                  adminController.pauseAd);
router.patch('/ads/:id/remove',       validate({ params: adminAdIdParamSchema, body: removeAdSchema }),                 adminController.removeAd);
router.get('/audit',                  validate({ query: auditLogsQuerySchema }),                                        adminController.getAuditLogs);
router.get('/stats',                  adminController.getPlatformStats);

export default router;