import type {
  RotatePosTokenInput,
  RotateShopApiTokenResult,
  ValidatePosTokenInput,
  ValidatePosTokenResult,
} from './types.js';
import { notImplemented } from './notImplemented.js';

const serviceName = 'posToken.service';

export const rotatePosToken = async (
  _input: RotatePosTokenInput
): Promise<RotateShopApiTokenResult> => {
  return notImplemented(serviceName, 'rotatePosToken');
};

export const validatePosToken = async (
  _input: ValidatePosTokenInput
): Promise<ValidatePosTokenResult> => {
  return notImplemented(serviceName, 'validatePosToken');
};
