import Joi from 'joi';
import { objectId } from './common.schemas.js';

// Generate a new checkin token
export const generateTokenBodySchema = Joi.object({
  shopId: Joi.string().hex().length(24), // optional — customer may not know shop yet
});

// Verify a token — owner or device scans it
export const verifyTokenBodySchema = Joi.object({
  token:        Joi.string().trim().required(),
  shopId:       objectId.required(),
  usedByDevice: Joi.string()
    .valid('mobile_camera', 'usb_scanner', 'kiosk', 'plugin')
    .required(),
});

// Token string as a URL param — for status check
export const tokenParamSchema = Joi.object({
  token: Joi.string().trim().required(),
});