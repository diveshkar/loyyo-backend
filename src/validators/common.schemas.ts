import Joi from 'joi';

export const objectId = Joi.string().hex().length(24);

export const paginationQuery = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
};

export const idParam = (name = 'id') =>
  Joi.object({
    [name]: objectId.required(),
  });

export const dateRangeQuery = {
  from: Joi.date().iso(),
  to: Joi.date().iso().min(Joi.ref('from')),
};
