import Joi from 'joi';
import { objectId, paginationQuery } from './common.schemas.js';

// ─── LOYALTY RULES ────────────────────────────────────────────────────────────

export const loyaltyRuleSchema = Joi.object({
  serviceId: Joi.string().hex().length(24),
  title: Joi.string().trim().min(2).max(160).required(),
  loyaltyType: Joi.string()
    .valid('visit', 'points', 'spend', 'product', 'hybrid', 'tier', 'referral', 'event')
    .required(),
  config: Joi.object().unknown(true).required(),
  reward: Joi.object({
    type: Joi.string()
      .valid('free_item', 'percent_discount', 'fixed_discount', 'cashback', 'voucher', 'buy_x_get_y')
      .required(),
    value: Joi.string().trim().min(1).max(500).required(),
  }).required(),
  visitsRequired: Joi.number().integer().min(1).max(1000),
  rewardDescription: Joi.string().trim().min(2).max(500),
});

// ─── VISIT MARKING ────────────────────────────────────────────────────────────

export const markVisitSchema = Joi.object({
  customerEmail: Joi.string().email().lowercase().trim().required(),
  serviceId: Joi.string().hex().length(24),
  checkinToken: Joi.string().trim().max(300),
  locationVerified: Joi.boolean(),
  spendAmount: Joi.number().min(0),
  productsBought: Joi.array().items(
    Joi.object({
      productId: Joi.string().trim().max(120),
      productName: Joi.string().trim().min(1).max(160).required(),
      quantity: Joi.number().integer().min(1).required(),
      points: Joi.number().integer().min(0),
    })
  ),
});

export const visitHistoryParamSchema = Joi.object({
  membershipId: objectId.required(),  // fixed from memId to match route param
});

export const visitHistoryQuerySchema = Joi.object({
  ...paginationQuery,
});

// ─── MEMBERS ──────────────────────────────────────────────────────────────────

export const shopMembersQuerySchema = Joi.object({
  ...paginationQuery,
  search: Joi.string().trim().max(100),  // search by name or email
});

// ─── MEMBERSHIP ───────────────────────────────────────────────────────────────

export const joinShopParamSchema = Joi.object({
  shopId: objectId.required(),
});

export const membershipParamSchema = Joi.object({
  shopId: objectId.required(),
});

export const membershipQuerySchema = Joi.object({
  ...paginationQuery,
});

// ─── REWARDS ──────────────────────────────────────────────────────────────────

export const redeemRewardParamSchema = Joi.object({
  rewardId: objectId.required(),
});

export const rewardsQuerySchema = Joi.object({
  ...paginationQuery,
  status: Joi.string().valid('pending', 'redeemed'),  // filter by status
});
