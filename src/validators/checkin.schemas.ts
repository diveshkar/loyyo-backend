import Joi from 'joi';
import { objectId } from './common.schemas.js';

const productsBoughtSchema = Joi.array().items(
  Joi.object({
    productId:   Joi.string().trim().max(120),
    productName: Joi.string().trim().min(1).max(160).required(),
    quantity:    Joi.number().integer().min(1).required(),
    points:      Joi.number().integer().min(0),
  })
);

// ── customer ──────────────────────────────────────────────────────────────────

export const generateTokenBodySchema = Joi.object({
  shopId: Joi.string().hex().length(24),
});

export const generateOrderCodeSchema = Joi.object({
  shopId: objectId.required(),
});

// ── shop ──────────────────────────────────────────────────────────────────────

export const verifyTokenBodySchema = Joi.object({
  token:           Joi.string().trim().required(),
  usedByDevice:    Joi.string().valid('mobile_camera', 'usb_scanner', 'kiosk', 'plugin').required(),
  serviceId:       Joi.string().hex().length(24),
  spendAmount:     Joi.number().min(0),
  productsBought:  productsBoughtSchema,
});

export const verifyOrderCodeSchema = Joi.object({
  orderCode:       Joi.string().trim().length(6).pattern(/^\d{6}$/).required(),
  serviceId:       Joi.string().hex().length(24),
  spendAmount:     Joi.number().min(0),
  productsBought:  productsBoughtSchema,
});

export const tokenParamSchema = Joi.object({
  token: Joi.string().trim().required(),
});