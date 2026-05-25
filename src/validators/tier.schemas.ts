import Joi from 'joi';
import { objectId } from './common.schemas.js';

// Get tier status for a specific shop membership
export const tierStatusParamSchema = Joi.object({
  shopId: objectId.required(),
});