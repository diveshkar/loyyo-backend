import Joi from 'joi';
import { objectId, paginationQuery } from './common.schemas.js';

export const joinShopParamSchema = Joi.object({
  shopId: objectId.required(),
});

export const customerMembershipParamSchema = Joi.object({
  shopId: objectId.required(),
});

export const shopMembersQuerySchema = Joi.object({
  search: Joi.string().trim().max(120),
  ...paginationQuery,
});

export const customerMembershipsQuerySchema = Joi.object({
  ...paginationQuery,
});
