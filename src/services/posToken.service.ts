import { AppError } from '../middleware/errorHandler.js';
import { Shop } from '../models/Shop.js';
import type {
  RotatePosTokenInput,
  RotateShopApiTokenResult,
  ValidatePosTokenInput,
  ValidatePosTokenResult,
} from './types.js';
import { rotateShopApiToken } from './shop.service.js';

export const rotatePosToken = async (
  input: RotatePosTokenInput
): Promise<RotateShopApiTokenResult> => rotateShopApiToken(input);

export const validatePosToken = async (
  input: ValidatePosTokenInput
): Promise<ValidatePosTokenResult> => {
  const shop = await Shop.findOne({ apiKey: input.token, status: 'active' }).select('+apiKey');
  if (!shop) throw new AppError('Invalid POS API token', 401);
  return { shop };
};
