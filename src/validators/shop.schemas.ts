import Joi from 'joi';
import { dateRangeQuery, objectId, paginationQuery } from './common.schemas.js';

export const shopIdParamSchema = Joi.object({
  id: objectId.required(),
});

export const updateShopProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(160),
  description: Joi.string().trim().min(1).max(2000),
  category: Joi.string().trim().min(2).max(80),
  logoUrl: Joi.string().uri(),
  address: Joi.string().trim().min(2).max(300),
  longitude: Joi.number().min(-180).max(180),
  latitude: Joi.number().min(-90).max(90),
}).min(1);

export const nearbyShopsQuerySchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  radiusKm: Joi.number().positive().max(100),
  category: Joi.string().trim().max(80),
  ...paginationQuery,
});

export const shopStatsQuerySchema = Joi.object({
  ...dateRangeQuery,
});
