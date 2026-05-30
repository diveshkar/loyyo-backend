import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import {
  notificationIdParamSchema,
  notificationsQuerySchema,
} from '../validators/notification.schemas.js';

const router = Router();

// all notification routes are customer-only
router.use(protect, restrictTo('customer'));

router.get('/',                              validate({ query: notificationsQuerySchema }),       notificationController.getNotifications);
router.get('/unread-count',                                                                       notificationController.getUnreadCount);
router.patch('/read-all',                                                                         notificationController.markAllNotificationsRead);
router.patch('/:notificationId/read',        validate({ params: notificationIdParamSchema }),     notificationController.markNotificationRead);
router.delete('/:notificationId',            validate({ params: notificationIdParamSchema }),     notificationController.deleteNotification);

export default router;
