import type { IAd } from '../models/Ad.js';
import type { IAuditLog } from '../models/AuditLog.js';
import type { IPayment } from '../models/Payment.js';
import type { IShop } from '../models/Shop.js';
import type { IUser } from '../models/User.js';
import type {
  AdminAdsInput,
  AdminPaymentsInput,
  AdminShopListInput,
  AdminUsersInput,
  ApproveShopInput,
  AuditLogsInput,
  PaginatedResult,
  PlatformStatsResult,
  RemoveAdInput,
  SuspendShopInput,
} from './types.js';
import { notImplemented } from './notImplemented.js';

const serviceName = 'admin.service';

export const getAdminShops = async (
  _input: AdminShopListInput
): Promise<PaginatedResult<IShop>> => {
  return notImplemented(serviceName, 'getAdminShops');
};

export const approveShop = async (_input: ApproveShopInput): Promise<IShop> => {
  return notImplemented(serviceName, 'approveShop');
};

export const suspendShop = async (_input: SuspendShopInput): Promise<IShop> => {
  return notImplemented(serviceName, 'suspendShop');
};

export const reinstateShop = async (_input: ApproveShopInput): Promise<IShop> => {
  return notImplemented(serviceName, 'reinstateShop');
};

export const getAdminUsers = async (_input: AdminUsersInput): Promise<PaginatedResult<IUser>> => {
  return notImplemented(serviceName, 'getAdminUsers');
};

export const getAdminPayments = async (
  _input: AdminPaymentsInput
): Promise<PaginatedResult<IPayment>> => {
  return notImplemented(serviceName, 'getAdminPayments');
};

export const getAdminAds = async (_input: AdminAdsInput): Promise<PaginatedResult<IAd>> => {
  return notImplemented(serviceName, 'getAdminAds');
};

export const removeAd = async (_input: RemoveAdInput): Promise<IAd> => {
  return notImplemented(serviceName, 'removeAd');
};

export const getAuditLogs = async (
  _input: AuditLogsInput
): Promise<PaginatedResult<IAuditLog>> => {
  return notImplemented(serviceName, 'getAuditLogs');
};

export const getPlatformStats = async (): Promise<PlatformStatsResult> => {
  return notImplemented(serviceName, 'getPlatformStats');
};
