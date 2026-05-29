import crypto from 'crypto';
import { Types } from 'mongoose';
import { AppError } from '../middleware/errorHandler.js';
import { Membership } from '../models/Membership.js';
import { Offer } from '../models/Offer.js';
import { Service } from '../models/Service.js';
import { Shop, type IShop } from '../models/Shop.js';
import { Visit } from '../models/Visit.js';
import type {
  CreateServiceInput,
  CurrentShopInput,
  DeleteServiceInput,
  GetServiceListInput,
  GetSubscriptionStatusInput,
  GetSubscriptionStatusResult,
  NearbyShopsInput,
  PaginatedResult,
  PublicShopInput,
  RotateShopApiTokenInput,
  RotateShopApiTokenResult,
  SearchShopsToJoinInput,
  ShopStatsInput,
  ShopStatsResult,
  UpdateServiceInput,
  UpdateShopProfileInput,
} from './types.js';
import { IService } from '../models/Service.js';

// ─────────────────────────────────────────────────────────────────────────────
// PLAN LIMITS
// ─────────────────────────────────────────────────────────────────────────────

const PLAN_SERVICE_LIMITS: Record<string, number | null> = {
  micro:    1,
  free:     2,
  basic:    5,
  standard: 15,
  premium:  null, // unlimited
};

const PLAN_MEMBER_LIMITS: Record<string, number | null> = {
  micro:    50,
  free:     null,
  basic:    null,
  standard: null,
  premium:  null,
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const toObjectId = (id: string | Types.ObjectId): Types.ObjectId =>
  new Types.ObjectId(id.toString());

const paginate = <T>(items: T[], total: number, page = 1, limit = 20): PaginatedResult<T> => ({
  items,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});

const resolveShopId = async (ownerId: string | Types.ObjectId): Promise<Types.ObjectId> => {
  const shop = await Shop.findOne({ ownerId: toObjectId(ownerId) }).select('_id').lean();
  if (!shop) throw new AppError('Shop not found for this owner', 404);
  return shop._id as Types.ObjectId;
};

// ─────────────────────────────────────────────────────────────────────────────
// EXISTING FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export const getCurrentShopProfile = async (input: CurrentShopInput): Promise<IShop> => {
  const shop = await Shop.findOne({ ownerId: toObjectId(input.ownerId) });
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
    // only sync location for physical shops
    if (current.businessType === 'physical') {
      const lng = longitude ?? current.locationLng;
      const lat = latitude ?? current.locationLat;
      payload.location = { type: 'Point', coordinates: [lng, lat] };
    }
  }

  const shop = await Shop.findOneAndUpdate(
    { ownerId: toObjectId(ownerId) },
    { $set: payload },
    { new: true, runValidators: true }
  );

  if (!shop) throw new AppError('Shop profile not found', 404);
  return shop;
};

export const getPublicShopProfile = async (input: PublicShopInput): Promise<IShop> => {
  const shop = await Shop.findById(input.shopId).select('-apiKey');
  if (!shop) throw new AppError('Shop not found', 404);

  // hide address if owner set isAddressPublic to false
  if (!shop.isAddressPublic) {
    shop.address = undefined;
  }

  return shop;
};

export const getNearbyShops = async (input: NearbyShopsInput): Promise<PaginatedResult<IShop>> => {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;
  const radiusMeters = (input.radiusKm ?? 10) * 1000;

  const filter: Record<string, unknown> = {
    status: 'active',
    businessType: 'physical', // home businesses excluded from nearby
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
    Shop.find(filter).select('-apiKey').skip((page - 1) * limit).limit(limit).lean(),
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
    { ownerId: toObjectId(input.ownerId) },
    { $set: { apiKey: token } },
    { new: true }
  );

  if (!shop) throw new AppError('Shop profile not found', 404);
  return { token, rotatedAt: new Date() };
};

// ─────────────────────────────────────────────────────────────────────────────
// NEW FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export const getSubscriptionStatus = async (
  input: GetSubscriptionStatusInput
): Promise<GetSubscriptionStatusResult> => {
  const shop = await getCurrentShopProfile({ ownerId: input.ownerId });

  const memberLimit = PLAN_MEMBER_LIMITS[shop.plan] ?? null;
  const memberCount = await Membership.countDocuments({ shopId: shop._id, isActive: true });

  const now = new Date();
  const isExpired = shop.planExpiresAt ? shop.planExpiresAt < now : false;
  const daysLeft = shop.planExpiresAt
    ? Math.max(0, Math.ceil((shop.planExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : undefined;

  return {
    plan: shop.plan,
    expiresAt: shop.planExpiresAt,
    isExpired,
    daysLeft,
    memberCount,
    memberLimit,
  };
};

export const searchShopsToJoin = async (
  input: SearchShopsToJoinInput
): Promise<PaginatedResult<IShop>> => {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;

  // get shops the customer already joined
  const memberships = await Membership.find({
    customerId: toObjectId(input.customerId),
    isActive: true,
  }).select('shopId').lean();
  const joinedShopIds = memberships.map((m) => m.shopId);

  const filter: Record<string, unknown> = {
    status: 'active',
    _id: { $nin: joinedShopIds },
    businessType: { $in: ['physical', 'home'] }, // both types searchable
  };

  // home businesses searchable by name/category only — no geo filter
  if (input.query) {
    filter.$or = [
      { name: { $regex: input.query, $options: 'i' } },
      { description: { $regex: input.query, $options: 'i' } },
      { category: { $regex: input.query, $options: 'i' } },
    ];
  }

  if (input.type) filter.type = input.type;
  if (input.category) filter.category = input.category;

  const [items, total] = await Promise.all([
    Shop.find(filter)
      .select('-apiKey -locationLng -locationLat -location') // hide raw coords
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Shop.countDocuments(filter),
  ]);

  // strip address from home shops that set isAddressPublic to false
  const sanitized = (items as IShop[]).map((s) => {
    if (s.businessType === 'home' && !s.isAddressPublic) {
      const { address: _a, ...rest } = s as any;
      return rest as IShop;
    }
    return s;
  });

  return paginate(sanitized, total, page, limit);
};

export const getServiceList = async (input: GetServiceListInput): Promise<IService[]> => {
  const shopId = await resolveShopId(input.ownerId);
  return Service.find({ shopId, isActive: true }).lean() as Promise<IService[]>;
};

export const createService = async (input: CreateServiceInput): Promise<IService> => {
  const shop = await getCurrentShopProfile({ ownerId: input.ownerId });
  const shopId = shop._id as Types.ObjectId;

  // plan service limit check
  const limit = PLAN_SERVICE_LIMITS[shop.plan];
  if (limit !== null) {
    const count = await Service.countDocuments({ shopId, isActive: true });
    if (count >= limit) {
      throw new AppError(
        `Your ${shop.plan} plan allows a maximum of ${limit} service${limit === 1 ? '' : 's'}. Upgrade to add more.`,
        403
      );
    }
  }

  const service = await Service.create({
    shopId,
    name: input.name,
    description: input.description,
    addons: input.addons ?? [],
    products: input.products ?? [],
  });

  return service;
};

export const updateService = async (input: UpdateServiceInput): Promise<IService> => {
  const shopId = await resolveShopId(input.ownerId);

  const { serviceId, ownerId: _o, ...updates } = input;
  const service = await Service.findOneAndUpdate(
    { _id: toObjectId(serviceId), shopId },
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!service) throw new AppError('Service not found', 404);
  return service;
};

export const deleteService = async (input: DeleteServiceInput): Promise<void> => {
  const shopId = await resolveShopId(input.ownerId);

  const service = await Service.findOneAndUpdate(
    { _id: toObjectId(input.serviceId), shopId },
    { $set: { isActive: false } }, // soft delete
    { new: true }
  );

  if (!service) throw new AppError('Service not found', 404);
};