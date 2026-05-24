import crypto from 'crypto';
import { Types } from 'mongoose';
import { AppError } from '../middleware/errorHandler.js';
import { Membership } from '../models/Membership.js';
import { Offer } from '../models/Offer.js';
import { Shop, type IShop } from '../models/Shop.js';
import { Visit } from '../models/Visit.js';
import type {
  CurrentShopInput,
  NearbyShopsInput,
  PaginatedResult,
  PublicShopInput,
  RotateShopApiTokenInput,
  RotateShopApiTokenResult,
  ShopStatsInput,
  ShopStatsResult,
  UpdateShopProfileInput,
} from './types.js';

const paginate = <T>(items: T[], total: number, page = 1, limit = 20): PaginatedResult<T> => ({
  items,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});

export const getCurrentShopProfile = async (input: CurrentShopInput): Promise<IShop> => {
  const shop = await Shop.findOne({ ownerId: new Types.ObjectId(input.ownerId.toString()) });
  if (!shop) throw new AppError('Shop profile not found', 404);
  return shop;
};

export const updateCurrentShopProfile = async (input: UpdateShopProfileInput): Promise<IShop> => {
  const { ownerId, longitude, latitude, ...updates } = input;
  const payload: Record<string, unknown> = { ...updates };

  if (typeof longitude === 'number') payload.locationLng = longitude;
  if (typeof latitude === 'number') payload.locationLat = latitude;
  if (typeof longitude === 'number' || typeof latitude === 'number') {
    const current = await getCurrentShopProfile({ ownerId });
    const lng = longitude ?? current.locationLng;
    const lat = latitude ?? current.locationLat;
    payload.location = { type: 'Point', coordinates: [lng, lat] };
  }

  const shop = await Shop.findOneAndUpdate(
    { ownerId: new Types.ObjectId(ownerId.toString()) },
    { $set: payload },
    { new: true, runValidators: true }
  );

  if (!shop) throw new AppError('Shop profile not found', 404);
  return shop;
};

export const getPublicShopProfile = async (input: PublicShopInput): Promise<IShop> => {
  const shop = await Shop.findById(input.shopId).select('-apiKey');
  if (!shop) throw new AppError('Shop not found', 404);
  return shop;
};

export const getNearbyShops = async (input: NearbyShopsInput): Promise<PaginatedResult<IShop>> => {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;
  const radiusMeters = (input.radiusKm ?? 10) * 1000;
  const filter: Record<string, unknown> = {
    status: 'active',
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [input.longitude, input.latitude] },
        $maxDistance: radiusMeters,
      },
    },
  };

  if (input.type) filter.type = input.type;
  if (input.category) filter.category = input.category;

  const [items, total] = await Promise.all([
    Shop.find(filter)
      .select('-apiKey')
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Shop.countDocuments(filter),
  ]);

  return paginate(items as IShop[], total, page, limit);
};

export const getShopStats = async (input: ShopStatsInput): Promise<ShopStatsResult> => {
  const shop = await getCurrentShopProfile({ ownerId: input.ownerId });
  const dateFilter: Record<string, unknown> = {};
  if (input.from || input.to) {
    dateFilter.createdAt = {
      ...(input.from ? { $gte: input.from } : {}),
      ...(input.to ? { $lte: input.to } : {}),
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalMembers, visitsToday, activeOffers] = await Promise.all([
    Membership.countDocuments({ shopId: shop._id, isActive: true }),
    Visit.countDocuments({ shopId: shop._id, createdAt: { $gte: today } }),
    Offer.countDocuments({
      shopId: shop._id,
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
      ...dateFilter,
    }),
  ]);

  return {
    totalMembers,
    visitsToday,
    activeOffers,
    subscriptionStatus: {
      plan: shop.plan,
      expiresAt: shop.planExpiresAt,
    },
  };
};

export const rotateShopApiToken = async (
  input: RotateShopApiTokenInput
): Promise<RotateShopApiTokenResult> => {
  const token = `loyyo_${crypto.randomBytes(32).toString('hex')}`;
  const shop = await Shop.findOneAndUpdate(
    { ownerId: new Types.ObjectId(input.ownerId.toString()) },
    { $set: { apiKey: token } },
    { new: true }
  );

  if (!shop) throw new AppError('Shop profile not found', 404);
  return { token, rotatedAt: new Date() };
};
