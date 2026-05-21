import Joi from 'joi';
import { objectId, paginationQuery } from './common.schemas.js';

export const customerOffersQuerySchema = Joi.object({
  ...paginationQuery,
});

export const createOfferSchema = Joi.object({
  title: Joi.string().trim().min(2).max(160).required(),
  description: Joi.string().trim().min(2).max(2000).required(),
  imageUrl: Joi.string().uri(),
  expiresAt: Joi.date().iso().greater('now').required(),
});

export const updateOfferSchema = Joi.object({
  title: Joi.string().trim().min(2).max(160),
  description: Joi.string().trim().min(2).max(2000),
  imageUrl: Joi.string().uri(),
  expiresAt: Joi.date().iso().greater('now'),
  isActive: Joi.boolean(),
}).min(1);

export const offerIdParamSchema = Joi.object({
  id: objectId.required(),
});
