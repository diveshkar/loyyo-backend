import type { NextFunction, Request, Response } from 'express';
import type { ObjectSchema } from 'joi';
import { AppError } from './errorHandler.js';

interface ValidationSchemas {
  body?: ObjectSchema;
  params?: ObjectSchema;
  query?: ObjectSchema;
}

export const validate = (schemas: ValidationSchemas) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const targets = [
      ['body', schemas.body, req.body],
      ['params', schemas.params, req.params],
      ['query', schemas.query, req.query],
    ] as const;

    for (const [target, schema, value] of targets) {
      if (!schema) {
        continue;
      }

      const { value: validatedValue, error } = schema.validate(value, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });

      if (error) {
        const message = error.details.map((detail) => detail.message).join(', ');
        return next(new AppError(`Invalid ${target}: ${message}`, 400));
      }

      if (target === 'body') {
        req.body = validatedValue;
      } else if (target === 'params') {
        req.params = validatedValue;
      } else {
        req.query = validatedValue;
      }
    }

    next();
  };
};
