import Joi from 'joi';

export const createPaymentIntentSchema = Joi.object({
  plan: Joi.string().valid('basic', 'standard', 'premium').required(),
});

export const payHereWebhookSchema = Joi.object().unknown(true);
