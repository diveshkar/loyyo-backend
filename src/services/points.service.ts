import { Types } from 'mongoose';
import { AppError } from '../middleware/errorHandler.js';
import { Membership } from '../models/Membership.js';
import { PointsLedger, type IPointsLedger } from '../models/PointsLedger.js';
import type {
  EntityId,
  GetPointsBalanceInput,
  GetPointsBalanceResult,
  GetPointsHistoryInput,
  PaginatedResult,
} from './types.js';

const toObjectId = (id: EntityId): Types.ObjectId =>
  new Types.ObjectId(id.toString());

const paginate = <T>(items: T[], total: number, page = 1, limit = 20): PaginatedResult<T> => ({
  items,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});

// ─────────────────────────────────────────────────────────────────────────────
// GET POINTS HISTORY
// ─────────────────────────────────────────────────────────────────────────────

export const getPointsHistory = async (
  input: GetPointsHistoryInput
): Promise<PaginatedResult<IPointsLedger>> => {
  const page  = input.page  ?? 1;
  const limit = input.limit ?? 20;

  const filter: Record<string, unknown> = {
    customerId: toObjectId(input.customerId),
  };
  if (input.shopId) filter.shopId = toObjectId(input.shopId);

  const [items, total] = await Promise.all([
    PointsLedger.find(filter)
      .populate('shopId',    'name logoUrl type')
      .populate('serviceId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    PointsLedger.countDocuments(filter),
  ]);

  return paginate(items as IPointsLedger[], total, page, limit);
};

// ─────────────────────────────────────────────────────────────────────────────
// GET POINTS BALANCE FOR A SPECIFIC SHOP
// ─────────────────────────────────────────────────────────────────────────────

export const getPointsBalance = async (
  input: GetPointsBalanceInput
): Promise<GetPointsBalanceResult> => {
  const customerId = toObjectId(input.customerId);
  const shopId     = toObjectId(input.shopId);

  const membership = await Membership.findOne({
    customerId,
    shopId,
    isActive: true,
  }).lean();

  if (!membership) throw new AppError('Membership not found', 404);

  const ledger = await PointsLedger.find({ customerId, shopId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return {
    totalPoints: membership.totalPoints,
    tierLevel:   (membership as any).tierLevel ?? 'none',
    ledger:      ledger as IPointsLedger[],
  };
};
