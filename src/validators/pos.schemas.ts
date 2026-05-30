import Joi from 'joi';

const productsBoughtSchema = Joi.array().items(
  Joi.object({
    productId:   Joi.string().trim().max(120),
    productName: Joi.string().trim().min(1).max(160).required(),
    quantity:    Joi.number().integer().min(1).required(),
    points:      Joi.number().integer().min(0),
  })
);

// POS device validates its token on startup
export const validatePosTokenSchema = Joi.object({
  token: Joi.string().trim().required(),
});

// POS device marks a visit
export const markPosVisitSchema = Joi.object({
  customerEmail:   Joi.string().email().lowercase().trim().required(),
  serviceId:       Joi.string().hex().length(24),
  checkinToken:    Joi.string().trim(),
  spendAmount:     Joi.number().min(0),
  productsBought:  productsBoughtSchema,
});
