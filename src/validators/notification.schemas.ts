import Joi from 'joi';
import { objectId, paginationQuery } from './common.schemas.js';

// Get all notifications for customer
export const notificationsQuerySchema = Joi.object({
  ...paginationQuery,
});

// Mark single notification as read
export const notificationIdParamSchema = Joi.object({
  notificationId: objectId.required(),
});