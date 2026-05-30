import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User, IUser } from '../models/User.js';
import { AppError } from './errorHandler.js';

// Extend Express Request type to include the authenticated user
export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export interface JwtPayload {
  id: string;
  role: 'customer' | 'shop' | 'admin';
}

export const protect = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // 1. Extract token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    // 2. Verify token
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, env.jwt.secret) as JwtPayload;
    } catch (err) {
      return next(new AppError('Invalid or expired token. Please log in again.', 401));
    }

    // 3. Check if user still exists and is active
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    if (!currentUser.isActive) {
      return next(new AppError('Your account has been deactivated. Please contact support.', 403));
    }

    // 4. Grant access to protected route and attach user to request object
    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};
