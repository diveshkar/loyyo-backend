import Joi from 'joi';
import { objectId, paginationQuery } from './common.schemas.js';

// ─── LOYALTY RULES ────────────────────────────────────────────────────────────

export const loyaltyRuleSchema = Joi.object({
  title:             Joi.string().trim().min(2).max(160).required(),
  visitsRequired:    Joi.number().integer().min(1).max(1000).required(),
  rewardDescription: Joi.string().trim().min(2).max(500).required(),
});

// ─── VISIT MARKING ────────────────────────────────────────────────────────────

export const markVisitSchema = Joi.object({
  customerEmail: Joi.string().email().lowercase().trim().required(),
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