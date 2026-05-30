import Joi from 'joi';

const password    = Joi.string().min(8).max(128).required();
const newPassword = Joi.string().min(8).max(128).required();

const shopType = Joi.string().valid(
  'tea_shop', 'salon', 'restaurant', 'supermarket',
  'clothing', 'electronics', 'gym', 'pharmacy',
  'grocery', 'bakery', 'home_bakery', 'home_kitchen',
  'home_salon', 'home_tuition', 'handmade', 'reseller', 'other'
);

// ─── REGISTER / LOGIN ─────────────────────────────────────────────────────────

export const registerCustomerSchema = Joi.object({
  name:     Joi.string().trim().min(2).max(120).required(),
  email:    Joi.string().email().lowercase().trim().required(),
  password,
  phone:    Joi.string().trim().max(30),
});

export const loginSchema = Joi.object({
  email:    Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

export const registerShopSchema = Joi.object({
  ownerName:    Joi.string().trim().min(2).max(120).required(),
  ownerEmail:   Joi.string().email().lowercase().trim().required(),
  password,
  phone:        Joi.string().trim().max(30),
  shopName:     Joi.string().trim().min(2).max(160).required(),
  description:  Joi.string().trim().min(1).max(2000).required(),
  businessType: Joi.string().valid('physical', 'home').required(),
  type:         shopType,
  category:     Joi.string().trim().min(2).max(80),
  logoUrl:      Joi.string().uri(),
  isAddressPublic: Joi.boolean().default(false),

  // physical shops — required when businessType is physical
  address:   Joi.when('businessType', {
    is:        'physical',
    then:      Joi.string().trim().min(2).max(300).required(),
    otherwise: Joi.string().trim().min(2).max(300), // optional for home
  }),
  longitude: Joi.when('businessType', {
    is:        'physical',
    then:      Joi.number().min(-180).max(180).required(),
    otherwise: Joi.number().min(-180).max(180),
  }),
  latitude:  Joi.when('businessType', {
    is:        'physical',
    then:      Joi.number().min(-90).max(90).required(),
    otherwise: Joi.number().min(-90).max(90),
  }),
}).or('type', 'category');

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const logoutSchema = Joi.object({
  refreshToken: Joi.string(),
});

// ─── PASSWORD ─────────────────────────────────────────────────────────────────

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
});

export const resetPasswordSchema = Joi.object({
  token:       Joi.string().trim().required(),
  newPassword: newPassword,
});

export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: newPassword,
});

// ─── PROFILE ──────────────────────────────────────────────────────────────────

export const updateProfileSchema = Joi.object({
  name:  Joi.string().trim().min(2).max(120),
  phone: Joi.string().trim().max(30).allow('', null),
}).min(1);