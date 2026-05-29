import Joi from 'joi';
import { objectId, paginationQuery } from './common.schemas.js';

export const customerOffersQuerySchema = Joi.object({
  ...paginationQuery,
});

export const shopOffersQuerySchema = Joi.object({
  isActive: Joi.boolean(),
  ...paginationQuery,
});

export const offerIdParamSchema = Joi.object({
  id: objectId.required(),
});

export const createOfferSchema = Joi.object({
  title:         Joi.string().trim().min(2).max(160).required(),
  description:   Joi.string().trim().min(2).max(2000).required(),
  imageUrl:      Joi.string().uri(),
  discountType:  Joi.string().valid('percent', 'free_item', 'fixed', 'cashback').required(),
  discountValue: Joi.string().trim().min(1).max(120).required(),
  startDate:     Joi.date().iso().required(),
  endDate:       Joi.date().iso().greater(Joi.ref('startDate')).required(),
  expiresAt:     Joi.date().iso().greater('now'),
});

export const updateOfferSchema = Joi.object({
  title:         Joi.string().trim().min(2).max(160),
  description:   Joi.string().trim().min(2).max(2000),
  imageUrl:      Joi.string().uri(),
  discountType:  Joi.string().valid('percent', 'free_item', 'fixed', 'cashback'),
  discountValue: Joi.string().trim().min(1).max(120),
  startDate:     Joi.date().iso(),
  endDate:       Joi.date().iso(),
  expiresAt:     Joi.date().iso().greater('now'),
  isActive:      Joi.boolean(),
}).min(1);

export const boostOfferSchema = Joi.object({
  weeklyBudget: Joi.number().positive().required(),
  endDate:      Joi.date().iso().greater('now').required(),
  startDate:    Joi.date().iso().greater('now'),
});