import { Types } from 'mongoose';
import { Ad, type IAd } from '../models/Ad.js';
import { AuditLog, type IAuditLog } from '../models/AuditLog.js';
import { Membership } from '../models/Membership.js';
import { Payment, type IPayment } from '../models/Payment.js';
import { Shop, type IShop } from '../models/Shop.js';
import { User, type IUser } from '../models/User.js';
import { Visit } from '../models/Visit.js';
import { AppError } from '../middleware/errorHandler.js';
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

const paginate = <T>(items: T[], total: number, page = 1, limit = 20): PaginatedResult<T> => ({
  items,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});

const audit = async (
  adminId: Types.ObjectId | string,
  action: IAuditLog['action'],
  targetType: IAuditLog['targetType'],
  targetId: Types.ObjectId | string,
  before: Record<string, any> | undefined,
  after: Record<string, any> | undefined,
  reason: string,
  ip?: string
): Promise<void> => {
  await AuditLog.create({
    adminId: new Types.ObjectId(adminId.toString()),
    action,
    targetType,
    targetId: new Types.ObjectId(targetId.toString()),
    before,
    after,
    reason,
    ip,
  });
};

export const getAdminShops = async (
  input: AdminShopListInput
): Promise<PaginatedResult<IShop>> => {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;
  const filter: Record<string, unknown> = {};
  if (input.status) filter.status = input.status;
  if (input.search) {
    filter.$or = [
      { name: { $regex: input.search, $options: 'i' } },
      { address: { $regex: input.search, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    Shop.find(filter)
      .populate('ownerId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Shop.countDocuments(filter),
  ]);

  return paginate(items as IShop[], total, page, limit);
};

export const approveShop = async (input: ApproveShopInput): Promise<IShop> => {
  const shop = await Shop.findById(input.shopId);
  if (!shop) throw new AppError('Shop not found', 404);
  const before = { status: shop.status };
  shop.status = 'active';
  await shop.save();
  await audit(input.adminId, 'SHOP_APPROVED', 'shop', shop._id as Types.ObjectId, before, { status: shop.status }, 'Shop approved', input.ip);
  return shop;
};

export const suspendShop = async (input: SuspendShopInput): Promise<IShop> => {
  const shop = await Shop.findById(input.shopId);
  if (!shop) throw new AppError('Shop not found', 404);
  const before = { status: shop.status };
  shop.status = 'suspended';
  await shop.save();
  await audit(input.adminId, 'SHOP_SUSPENDED', 'shop', shop._id as Types.ObjectId, before, { status: shop.status }, input.reason, input.ip);
  return shop;
};

export const reinstateShop = async (input: ApproveShopInput): Promise<IShop> => {
  const shop = await Shop.findById(input.shopId);
  if (!shop) throw new AppError('Shop not found', 404);
  const before = { status: shop.status };
  shop.status = 'active';
  await shop.save();
  await audit(input.adminId, 'SHOP_REINSTATED', 'shop', shop._id as Types.ObjectId, before, { status: shop.status }, 'Shop reinstated', input.ip);
  return shop;
};

export const getAdminUsers = async (input: AdminUsersInput): Promise<PaginatedResult<IUser>> => {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;
  const filter: Record<string, unknown> = {};
  if (input.search) {
    filter.$or = [
      { name: { $regex: input.search, $options: 'i' } },
      { email: { $regex: input.search, $options: 'i' } },
      { phone: { $regex: input.search, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  return paginate(items as IUser[], total, page, limit);
};

export const getAdminPayments = async (
  input: AdminPaymentsInput
): Promise<PaginatedResult<IPayment>> => {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;
  const filter: Record<string, unknown> = {};
  if (input.status) filter.status = input.status;
  if (input.plan) filter.plan = input.plan;

  const [items, total] = await Promise.all([
    Payment.find(filter).populate('shopId', 'name type').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Payment.countDocuments(filter),
  ]);
  return paginate(items as IPayment[], total, page, limit);
};

export const getAdminAds = async (input: AdminAdsInput): Promise<PaginatedResult<IAd>> => {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;
  const filter: Record<string, unknown> = {};
  if (typeof input.isActive === 'boolean') filter.isActive = input.isActive;
  if (input.adType) filter.adType = input.adType;

  const [items, total] = await Promise.all([
    Ad.find(filter).populate('shopId', 'name type').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Ad.countDocuments(filter),
  ]);
  return paginate(items as IAd[], total, page, limit);
};

export const removeAd = async (input: RemoveAdInput): Promise<IAd> => {
  const ad = await Ad.findById(input.adId);
  if (!ad) throw new AppError('Ad not found', 404);
  const before = { isActive: ad.isActive };
  ad.isActive = false;
  await ad.save();
  await audit(input.adminId, 'AD_REMOVED', 'ad', ad._id as Types.ObjectId, before, { isActive: false }, input.reason ?? 'Ad removed', input.ip);
  return ad;
};

export const getAuditLogs = async (
  input: AuditLogsInput
): Promise<PaginatedResult<IAuditLog>> => {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;
  const filter: Record<string, unknown> = {};
  if (input.action) filter.action = input.action;
  if (input.targetType) filter.targetType = input.targetType;
  if (input.from || input.to) {
    filter.createdAt = {
      ...(input.from ? { $gte: input.from } : {}),
      ...(input.to ? { $lte: input.to } : {}),
    };
  }

  const [items, total] = await Promise.all([
    AuditLog.find(filter).populate('adminId', 'name email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    AuditLog.countDocuments(filter),
  ]);
  return paginate(items as IAuditLog[], total, page, limit);
};

export const getPlatformStats = async (): Promise<PlatformStatsResult> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [totalShops, totalUsers, visitsToday, paidPayments, activeAds] = await Promise.all([
    Shop.countDocuments(),
    User.countDocuments(),
    Visit.countDocuments({ createdAt: { $gte: today } }),
    Payment.find({ status: 'paid' }).select('amount').lean(),
    Ad.countDocuments({ isActive: true }),
    Membership.countDocuments(),
  ]);

  return {
    totalShops,
    totalUsers,
    visitsToday,
    revenue: paidPayments.reduce((sum, payment) => sum + payment.amount, 0),
    activeAds,
  };
};
