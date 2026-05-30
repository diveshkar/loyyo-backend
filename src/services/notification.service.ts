import { Types } from 'mongoose';
import { AppError } from '../middleware/errorHandler.js';
import { Notification, type INotification } from '../models/Notification.js';
import type {
  EntityId,
  GetNotificationsInput,
  MarkAllReadInput,
  MarkNotificationReadInput,
  PaginatedResult,
} from './types.js';

const toObjectId = (id: EntityId): Types.ObjectId =>
  new Types.ObjectId(id.toString());

const paginate = <T>(items: T[], total: number, page = 1, limit = 20): PaginatedResult<T> => ({
  items,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});

// ─────────────────────────────────────────────────────────────────────────────
// GET NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const getNotifications = async (
  input: GetNotificationsInput
): Promise<PaginatedResult<INotification>> => {
  const page  = input.page  ?? 1;
  const limit = input.limit ?? 20;

  const filter = { customerId: toObjectId(input.customerId) };

  const [items, total] = await Promise.all([
    Notification.find(filter)
      .populate('shopId', 'name logoUrl type')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
  ]);

  return paginate(items as INotification[], total, page, limit);
};

// ─────────────────────────────────────────────────────────────────────────────
// GET UNREAD COUNT
// ─────────────────────────────────────────────────────────────────────────────

export const getUnreadCount = async (
  customerId: EntityId
): Promise<{ unreadCount: number }> => {
  const unreadCount = await Notification.countDocuments({
    customerId: toObjectId(customerId),
    isRead:     false,
  });
  return { unreadCount };
};

// ─────────────────────────────────────────────────────────────────────────────
// MARK ONE AS READ
// ─────────────────────────────────────────────────────────────────────────────

export const markNotificationRead = async (
  input: MarkNotificationReadInput
): Promise<INotification> => {
  const notification = await Notification.findOneAndUpdate(
    {
      _id:        toObjectId(input.notificationId),
      customerId: toObjectId(input.customerId),
    },
    { $set: { isRead: true } },
    { new: true }
  );

  if (!notification) throw new AppError('Notification not found', 404);
  return notification;
};

// ─────────────────────────────────────────────────────────────────────────────
// MARK ALL AS READ
// ─────────────────────────────────────────────────────────────────────────────

export const markAllNotificationsRead = async (
  input: MarkAllReadInput
): Promise<{ updated: number }> => {
  const result = await Notification.updateMany(
    { customerId: toObjectId(input.customerId), isRead: false },
    { $set: { isRead: true } }
  );
  return { updated: result.modifiedCount };
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE ONE NOTIFICATION
// ─────────────────────────────────────────────────────────────────────────────

export const deleteNotification = async (
  notificationId: EntityId,
  customerId:     EntityId
): Promise<void> => {
  const result = await Notification.findOneAndDelete({
    _id:        toObjectId(notificationId),
    customerId: toObjectId(customerId),
  });
  if (!result) throw new AppError('Notification not found', 404);
};
