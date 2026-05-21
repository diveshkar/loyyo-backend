import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { AppError } from './errorHandler.js';

export const restrictTo = (...roles: Array<'customer' | 'shop' | 'admin'>) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    // req.user is guaranteed to exist if protect middleware ran successfully
    if (!req.user) {
      return next(new AppError('Authentication required to perform this action', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};
