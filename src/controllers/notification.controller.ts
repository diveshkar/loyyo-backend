import * as notificationService from '../services/notification.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/http.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await notificationService.getNotifications({
    customerId: authReq.user!._id,
    page:       Number(req.query.page)  || undefined,
    limit:      Number(req.query.limit) || undefined,
  });
  sendSuccess(res, result);
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await notificationService.getUnreadCount(authReq.user!._id);
  sendSuccess(res, result);
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await notificationService.markNotificationRead({
    notificationId: String(req.params.notificationId),
    customerId:     authReq.user!._id,
  });
  sendSuccess(res, result);
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await notificationService.markAllNotificationsRead({
    customerId: authReq.user!._id,
  });
  sendSuccess(res, result);
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  await notificationService.deleteNotification(
    String(req.params.notificationId),
    authReq.user!._id
  );
  sendSuccess(res, { deleted: true });
});
