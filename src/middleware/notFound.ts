import type { NextFunction, Request, Response } from 'express';
import { AppError } from './errorHandler.js';

export const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
};
