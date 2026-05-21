import Joi from 'joi';

const password = Joi.string().min(8).max(128).required();

export const registerCustomerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password,
  phone: Joi.string().trim().max(30),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

export const registerShopSchema = Joi.object({
  ownerName: Joi.string().trim().min(2).max(120).required(),
  ownerEmail: Joi.string().email().lowercase().trim().required(),
  password,
  phone: Joi.string().trim().max(30),
  shopName: Joi.string().trim().min(2).max(160).required(),
  description: Joi.string().trim().min(1).max(2000).required(),
  category: Joi.string().trim().min(2).max(80).required(),
  address: Joi.string().trim().min(2).max(300).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  latitude: Joi.number().min(-90).max(90).required(),
  logoUrl: Joi.string().uri(),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const logoutSchema = Joi.object({
  refreshToken: Joi.string(),
});
