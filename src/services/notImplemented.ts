import { AppError } from '../middleware/errorHandler.js';

export const notImplemented = (serviceName: string, methodName: string): never => {
  throw new AppError(`${serviceName}.${methodName} is not implemented yet`, 501);
};
