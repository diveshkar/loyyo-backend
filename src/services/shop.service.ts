import type { PaginatedResult } from './types.js';
import type {
  CurrentShopInput,
  NearbyShopsInput,
  PublicShopInput,
  RotateShopApiTokenInput,
  RotateShopApiTokenResult,
  ShopStatsInput,
  ShopStatsResult,
  UpdateShopProfileInput,
} from './types.js';
import type { IShop } from '../models/Shop.js';
import { notImplemented } from './notImplemented.js';

const serviceName = 'shop.service';

export const getCurrentShopProfile = async (_input: CurrentShopInput): Promise<IShop> => {
  return notImplemented(serviceName, 'getCurrentShopProfile');
};

export const updateCurrentShopProfile = async (_input: UpdateShopProfileInput): Promise<IShop> => {
  return notImplemented(serviceName, 'updateCurrentShopProfile');
};

export const getPublicShopProfile = async (_input: PublicShopInput): Promise<IShop> => {
  return notImplemented(serviceName, 'getPublicShopProfile');
};

export const getNearbyShops = async (_input: NearbyShopsInput): Promise<PaginatedResult<IShop>> => {
  return notImplemented(serviceName, 'getNearbyShops');
};

export const getShopStats = async (_input: ShopStatsInput): Promise<ShopStatsResult> => {
  return notImplemented(serviceName, 'getShopStats');
};

export const rotateShopApiToken = async (
  _input: RotateShopApiTokenInput
): Promise<RotateShopApiTokenResult> => {
  return notImplemented(serviceName, 'rotateShopApiToken');
};
