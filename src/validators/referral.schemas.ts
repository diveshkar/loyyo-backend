import Joi from 'joi';
import { objectId, paginationQuery } from './common.schemas.js';

// Generate referral code for a shop
export const generateReferralCodeSchema = Joi.object({
  shopId: objectId.required(),
});

// Apply a referral code when new customer registers
export const applyReferralCodeSchema = Joi.object({
  code: Joi.string().trim().uppercase().min(4).max(20).required(),
});

// Get referrals for a customer — optional filter by shop
export const referralsQuerySchema = Joi.object({
  shopId: Joi.string().hex().length(24),
  ...paginationQuery,
});

// Referral ID param — for status check
export const referralIdParamSchema = Joi.object({
  referralId: objectId.required(),
});