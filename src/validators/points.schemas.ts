import Joi from 'joi';
import { objectId, paginationQuery } from './common.schemas.js';

// Get points history — optional filter by shop
export const pointsHistoryQuerySchema = Joi.object({
  shopId: Joi.string().hex().length(24), // optional — all shops if not provided
  ...paginationQuery,
});

// Get points balance for a specific shop
export const pointsBalanceParamSchema = Joi.object({
  shopId: objectId.required(),
});