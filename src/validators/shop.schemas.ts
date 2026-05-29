import Joi from 'joi';
import { dateRangeQuery, objectId, paginationQuery } from './common.schemas.js';

const shopType = Joi.string().valid(
  'tea_shop',
  'salon',
  'restaurant',
  'supermarket',
  'clothing',
  'electronics',
  'gym',
  'pharmacy',
  'grocery',
  'bakery',
  'home_bakery',
  'home_kitchen',
  'home_salon',
  'home_tuition',
  'handmade',
  'reseller',
  'other',
);

export const shopIdParamSchema = Joi.object({
  id: objectId.required(),
});

export const updateShopProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(160),
  description: Joi.string().trim().min(1).max(2000),
  type: shopType,
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
  type: shopType,
  category: Joi.string().trim().max(80),
  ...paginationQuery,
});

export const shopStatsQuerySchema = Joi.object({
  ...dateRangeQuery,
});

const addonSchema = Joi.object({
  name:      Joi.string().trim().min(1).max(120).required(),
  price:     Joi.number().min(0).required(),
  isVisible: Joi.boolean(),
});

const serviceProductSchema = Joi.object({
  productId: Joi.string().trim().min(1).max(120).required(),
  name:      Joi.string().trim().min(1).max(160).required(),
  price:     Joi.number().min(0).required(),
  points:    Joi.number().min(0).required(),
  isVisible: Joi.boolean(),
});

export const searchShopsToJoinQuerySchema = Joi.object({
  query:    Joi.string().trim().min(1).max(120),
  type:     shopType,
  category: Joi.string().trim().max(80),
  ...paginationQuery,
});

export const createServiceSchema = Joi.object({
  name:        Joi.string().trim().min(1).max(160).required(),
  description: Joi.string().trim().max(2000),
  addons:      Joi.array().items(addonSchema),
  products:    Joi.array().items(serviceProductSchema),
});

export const updateServiceSchema = Joi.object({
  name:        Joi.string().trim().min(1).max(160),
  description: Joi.string().trim().max(2000),
  addons:      Joi.array().items(addonSchema),
  products:    Joi.array().items(serviceProductSchema),
  isActive:    Joi.boolean(),
}).min(1);

export const serviceIdParamSchema = Joi.object({
  serviceId: objectId.required(),
});
