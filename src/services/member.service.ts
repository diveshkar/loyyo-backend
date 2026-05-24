import { Types } from 'mongoose';
import { AppError } from '../middleware/errorHandler.js';
import { LoyaltyRule } from '../models/LoyaltyRule.js';
import { Membership, type IMembership } from '../models/Membership.js';
import { Shop } from '../models/Shop.js';
import { User } from '../models/User.js';
import type {
  CustomerMembershipInput,
  CustomerMembershipsInput,
  JoinShopInput,
  MembershipWithCustomer,
  MembershipWithShop,
  PaginatedResult,
  ShopMembersInput,
} from './types.js';

const paginate = <T>(items: T[], total: number, page = 1, limit = 20): PaginatedResult<T> => ({
  items,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});

const resolveShopId = async (ownerId: Types.ObjectId | string): Promise<Types.ObjectId> => {
  const shop = await Shop.findOne({ ownerId: new Types.ObjectId(ownerId.toString()) }).select('_id').lean();
  if (!shop) throw new AppError('Shop not found for this owner', 404);
  return shop._id as Types.ObjectId;
};

export const joinShop = async (input: JoinShopInput): Promise<IMembership> => {
  const customerId = new Types.ObjectId(input.customerId.toString());
  const shopId = new Types.ObjectId(input.shopId.toString());

  const shop = await Shop.findById(shopId).select('status').lean();
  if (!shop) throw new AppError('Shop not found', 404);
  if (shop.status !== 'active') throw new AppError('This shop is not active', 403);

  const existing = await Membership.findOne({ customerId, shopId }).lean();
  if (existing) throw new AppError('You are already a member of this shop', 409);

  const activeRules = await LoyaltyRule.find({ shopId, isActive: true }).lean();
  return Membership.create({
    customerId,
    shopId,
    ruleProgress: activeRules.map((rule) => ({
      ruleId: rule._id,
      visitCount: 0,
      pointsCount: 0,
      spendCount: 0,
      version: rule.version,
      status: 'active',
    })),
    totalVisits: 0,
    totalPoints: 0,
    totalSpend: 0,
    tierLevel: 'none',
    joinedAt: new Date(),
    isActive: true,
  });
};

export const getCustomerMemberships = async (
  input: CustomerMembershipsInput
): Promise<PaginatedResult<MembershipWithShop>> => {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;
  const filter = { customerId: new Types.ObjectId(input.customerId.toString()), isActive: true };

  const [items, total] = await Promise.all([
    Membership.find(filter)
      .populate('shopId', 'name type address locationLng locationLat logoUrl profilePhoto')
      .populate('ruleProgress.ruleId', 'title loyaltyType config reward version serviceId')
      .sort({ lastVisitAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Membership.countDocuments(filter),
  ]);

  return paginate(items as unknown as MembershipWithShop[], total, page, limit);
};

export const getCustomerMembership = async (
  input: CustomerMembershipInput
): Promise<MembershipWithShop> => {
  const membership = await Membership.findOne({
    customerId: new Types.ObjectId(input.customerId.toString()),
    shopId: new Types.ObjectId(input.shopId.toString()),
  })
    .populate('shopId', 'name type address locationLng locationLat logoUrl profilePhoto')
    .populate('ruleProgress.ruleId', 'title loyaltyType config reward version serviceId')
    .lean();

  if (!membership) throw new AppError('Membership not found', 404);
  return membership as unknown as MembershipWithShop;
};

export const getShopMembers = async (
  input: ShopMembersInput
): Promise<PaginatedResult<MembershipWithCustomer>> => {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;
  const shopId = await resolveShopId(input.ownerId.toString());

  let customerIds: Types.ObjectId[] | undefined;
  if (input.search) {
    const customers = await User.find({
      $or: [
        { name: { $regex: input.search, $options: 'i' } },
        { email: { $regex: input.search, $options: 'i' } },
        { phone: { $regex: input.search, $options: 'i' } },
      ],
    }).select('_id').lean();
    customerIds = customers.map((customer) => customer._id as Types.ObjectId);
  }

  const filter: Record<string, unknown> = { shopId, isActive: true };
  if (customerIds) filter.customerId = { $in: customerIds };

  const [items, total] = await Promise.all([
    Membership.find(filter)
      .populate('customerId', 'name email phone profilePhoto')
      .populate('ruleProgress.ruleId', 'title loyaltyType config reward version serviceId')
      .sort({ lastVisitAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Membership.countDocuments(filter),
  ]);

  return paginate(items as unknown as MembershipWithCustomer[], total, page, limit);
};
