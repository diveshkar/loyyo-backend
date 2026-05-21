import type { NextFunction, Request, Response } from 'express';
import type { IShop } from '../models/Shop.js';
import { AppError } from './errorHandler.js';
import * as posTokenService from '../services/posToken.service.js';

export interface PosAuthenticatedRequest extends Request {
  shop?: IShop;
}

export const protectPosToken = async (
  req: PosAuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;

    if (!token) {
      return next(new AppError('POS API token is required', 401));
    }

    const result = await posTokenService.validatePosToken({ token });
    req.shop = result.shop;
    next();
  } catch (error) {
    next(error);
  }
};
