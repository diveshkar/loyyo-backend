import Joi from 'joi';
import { objectId, paginationQuery } from './common.schemas.js';

export const generateReferralCodeSchema = Joi.object({
  shopId: objectId.required(),
});

export const applyReferralCodeSchema = Joi.object({
  code: Joi.string().trim().uppercase().min(4).max(20).required(),
});

export const referralsQuerySchema = Joi.object({
  shopId: Joi.string().hex().length(24),
  ...paginationQuery,
});

export const referralIdParamSchema = Joi.object({
  referralId: objectId.required(),
});