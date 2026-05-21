import Joi from 'joi';
import { objectId } from './common.schemas.js';

export const rewardIdParamSchema = Joi.object({
  rewardId: objectId.required(),
});
