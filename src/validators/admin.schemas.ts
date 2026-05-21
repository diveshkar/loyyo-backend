import Joi from 'joi';
import { dateRangeQuery, objectId, paginationQuery } from './common.schemas.js';

export const adminListShopsQuerySchema = Joi.object({
  status: Joi.string().valid('pending', 'active', 'suspended'),
  search: Joi.string().trim().max(120),
  ...paginationQuery,
});

export const adminShopIdParamSchema = Joi.object({
  id: objectId.required(),
});

export const suspendShopSchema = Joi.object({
  reason: Joi.string().trim().min(2).max(1000).required(),
});

export const adminUsersQuerySchema = Joi.object({
  search: Joi.string().trim().max(120),
  ...paginationQuery,
});

export const adminPaymentsQuerySchema = Joi.object({
  status: Joi.string().valid('pending', 'paid', 'failed', 'refunded'),
  plan: Joi.string().valid('basic', 'standard', 'premium'),
  ...paginationQuery,
});

export const adminAdsQuerySchema = Joi.object({
  isActive: Joi.boolean(),
  ...paginationQuery,
});

export const adminAdIdParamSchema = Joi.object({
  id: objectId.required(),
});

export const removeAdSchema = Joi.object({
  reason: Joi.string().trim().max(1000),
});

export const auditLogsQuerySchema = Joi.object({
  action: Joi.string().valid(
    'SHOP_APPROVED',
    'SHOP_SUSPENDED',
    'SHOP_REINSTATED',
    'USER_DEACTIVATED',
    'AD_REMOVED',
    'PAYMENT_REFUNDED'
  ),
  targetType: Joi.string().valid('shop', 'user', 'ad', 'payment'),
  ...dateRangeQuery,
  ...paginationQuery,
});
