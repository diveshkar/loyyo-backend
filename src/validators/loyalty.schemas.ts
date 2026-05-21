import Joi from 'joi';
import { objectId, paginationQuery } from './common.schemas.js';

export const loyaltyRuleSchema = Joi.object({
  title: Joi.string().trim().min(2).max(160).required(),
  visitsRequired: Joi.number().integer().min(1).max(1000).required(),
  rewardDescription: Joi.string().trim().min(2).max(500).required(),
});

export const markVisitSchema = Joi.object({
  customerEmail: Joi.string().email().lowercase().trim().required(),
});

export const visitHistoryParamSchema = Joi.object({
  memId: objectId.required(),
});

export const visitHistoryQuerySchema = Joi.object({
  ...paginationQuery,
});
