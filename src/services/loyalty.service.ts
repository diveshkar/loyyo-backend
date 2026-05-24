import { Types } from 'mongoose';
import { AppError } from '../middleware/errorHandler.js';
import { LoyaltyRule, type ILoyaltyRule } from '../models/LoyaltyRule.js';
import { Membership, type IMembership } from '../models/Membership.js';
import { Notification, type INotification } from '../models/Notification.js';
import { PointsLedger } from '../models/PointsLedger.js';
import { Shop } from '../models/Shop.js';
import { User } from '../models/User.js';
import { Visit, type IVisit } from '../models/Visit.js';
import type {
  CreateOrUpdateLoyaltyRuleInput,
  CustomerMembershipInput,
  CustomerMembershipsInput,
  EntityId,
  GetAllActiveRulesInput,
  GetMyRewardsInput,
  JoinShopInput,
  MarkPosVisitInput,
  MarkVisitInput,
  MembershipWithShopAndRules,
  PaginatedResult,
  RedeemRewardInput,
  ShopMembersInput,
  VisitHistoryInput,
} from './types.js';
import { MarkedByMethod } from '../models/enums.js';

const paginate = <T>(items: T[], total: number, page = 1, limit = 20): PaginatedResult<T> => ({
  items,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});

const toObjectId = (id: EntityId): Types.ObjectId => new Types.ObjectId(id.toString());

const resolveShopId = async (ownerId: EntityId): Promise<Types.ObjectId> => {
  const shop = await Shop.findOne({ ownerId: toObjectId(ownerId) }).select('_id').lean();
  if (!shop) throw new AppError('Shop not found for this owner', 404);
  return shop._id as Types.ObjectId;
};

const getNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const calculateProductPoints = (products: MarkVisitInput['productsBought'] = []): number =>
  products.reduce((sum, product) => sum + getNumber(product.points) * product.quantity, 0);

const calculateVisitPoints = (rule: ILoyaltyRule, spendAmount = 0, products: MarkVisitInput['productsBought'] = []): number => {
  const config = rule.config ?? {};
  return (
    getNumber(config.points_per_visit) +
    getNumber(config.points_per_spend) * spendAmount +
    calculateProductPoints(products) +
    getNumber(config.points_multiplier, 1) * 0
  );
};

const isRuleCompleted = (rule: ILoyaltyRule, progress: IMembership['ruleProgress'][number]): boolean => {
  const config = rule.config ?? {};

  switch (rule.loyaltyType) {
    case 'visit':
      return progress.visitCount >= getNumber(config.visit_count_target, Number.MAX_SAFE_INTEGER);
    case 'points':
      return progress.pointsCount >= getNumber(config.points_target, Number.MAX_SAFE_INTEGER);
    case 'spend':
      return progress.spendCount >= getNumber(config.spend_target, Number.MAX_SAFE_INTEGER);
    case 'hybrid':
      return (
        progress.visitCount >= getNumber(config.visits_needed, Number.MAX_SAFE_INTEGER) &&
        progress.pointsCount >= getNumber(config.points_needed, Number.MAX_SAFE_INTEGER)
      );
    default:
      return false;
  }
};

const createRewardNotification = async (
  membership: IMembership,
  rule: ILoyaltyRule
): Promise<INotification> => {
  return Notification.create({
    customerId: membership.customerId,
    shopId: membership.shopId,
    type: 'reward_earned',
    title: rule.title,
    message: rule.reward?.value ?? 'Reward earned',
    isRead: false,
    emailSent: false,
  });
};

const processVisit = async (
  membership: IMembership,
  input: {
    serviceId?: EntityId;
    markedByMethod: MarkedByMethod;
    checkinToken?: string;
    locationVerified?: boolean;
    spendAmount?: number;
    productsBought?: MarkVisitInput['productsBought'];
  }
): Promise<{ membership: IMembership; visit: IVisit; rewardsEarned: INotification[]; pointsEarned: number }> => {
  const spendAmount = input.spendAmount ?? 0;
  const productsBought = input.productsBought ?? [];
  const rewardsEarned: INotification[] = [];
  let totalPointsEarned = 0;

  const activeRules = await LoyaltyRule.find({
    shopId: membership.shopId,
    ...(input.serviceId ? { serviceId: toObjectId(input.serviceId) } : {}),
    isActive: true,
  });

  const progressByRule = new Map(membership.ruleProgress.map((progress) => [progress.ruleId.toString(), progress]));
  const updatedProgress = [...membership.ruleProgress];

  for (const rule of activeRules) {
    let progress = progressByRule.get(String(rule._id));
    if (!progress) {
      progress = {
        ruleId: rule._id as Types.ObjectId,
        visitCount: 0,
        pointsCount: 0,
        spendCount: 0,
        version: rule.version,
        status: 'active',
      };
      updatedProgress.push(progress);
      progressByRule.set(String(rule._id), progress);
    }

    if (progress.status !== 'active') continue;

    progress.visitCount += 1;
    progress.spendCount += spendAmount;

    const pointsFromRule = calculateVisitPoints(rule, spendAmount, productsBought);
    progress.pointsCount += pointsFromRule;
    totalPointsEarned += pointsFromRule;

    if (isRuleCompleted(rule, progress)) {
      progress.status = 'completed';
      rewardsEarned.push(await createRewardNotification(membership, rule));
    }
  }

  const visit = await Visit.create({
    customerId: membership.customerId,
    shopId: membership.shopId,
    membershipId: membership._id,
    markedByMethod: input.markedByMethod,
    checkinToken: input.checkinToken,
    locationVerified: input.locationVerified ?? false,
    spendAmount,
    pointsEarned: totalPointsEarned,
    productsBought,
  });

  const updatedMembership = await Membership.findByIdAndUpdate(
    membership._id,
    {
      $set: {
        ruleProgress: updatedProgress,
        lastVisitAt: new Date(),
      },
      $inc: {
        totalVisits: 1,
        totalPoints: totalPointsEarned,
        totalSpend: spendAmount,
      },
    },
    { new: true, runValidators: true }
  );

  if (!updatedMembership) throw new AppError('Membership update failed', 500);

  if (totalPointsEarned !== 0) {
    await PointsLedger.create({
      customerId: membership.customerId,
      shopId: membership.shopId,
      serviceId: input.serviceId ? toObjectId(input.serviceId) : undefined,
      visitRef: visit._id,
      action: 'earn',
      source: spendAmount > 0 ? 'spend' : productsBought.length ? 'product' : 'visit',
      points: totalPointsEarned,
      spendAmount,
      balanceAfter: updatedMembership.totalPoints,
      note: 'Visit points earned',
    });
  }

  await Notification.create({
    customerId: membership.customerId,
    shopId: membership.shopId,
    type: 'visit_marked',
    title: 'Visit marked',
    message: 'Your loyalty visit was recorded.',
    isRead: false,
    emailSent: false,
  });

  return { membership: updatedMembership, visit, rewardsEarned, pointsEarned: totalPointsEarned };
};

export const createOrUpdateRuleForOwner = async (
  input: CreateOrUpdateLoyaltyRuleInput
): Promise<ILoyaltyRule> => {
  const shopId = await resolveShopId(input.ownerId);
  const serviceId = input.serviceId ? toObjectId(input.serviceId) : undefined;
  const config = { ...input.config };
  const reward = input.reward ?? {
    type: 'voucher',
    value: input.rewardDescription ?? 'Reward',
  };

  if (input.visitsRequired && !config.visit_count_target) {
    config.visit_count_target = input.visitsRequired;
  }

  const existingRule = await LoyaltyRule.findOne({
    shopId,
    ...(serviceId ? { serviceId } : {}),
    title: { $regex: new RegExp(`^${input.title}$`, 'i') },
    isActive: true,
  });

  if (existingRule) {
    existingRule.isActive = false;
    await existingRule.save();
  }

  const newRule = await LoyaltyRule.create({
    shopId,
    serviceId,
    title: input.title,
    loyaltyType: input.loyaltyType,
    config,
    reward,
    rewardDescription: reward.value,
    visitsRequired: config.visit_count_target,
    version: existingRule ? existingRule.version + 1 : 1,
    isActive: true,
  });

  await Membership.updateMany(
    { shopId, isActive: true },
    {
      $push: {
        ruleProgress: {
          ruleId: newRule._id,
          visitCount: 0,
          pointsCount: 0,
          spendCount: 0,
          version: newRule.version,
          status: 'active',
        },
      },
    }
  );

  return newRule;
};

export const getAllActiveRules = async (input: GetAllActiveRulesInput): Promise<ILoyaltyRule[]> => {
  const shopId = await resolveShopId(input.ownerId);
  return LoyaltyRule.find({ shopId, isActive: true }).sort({ createdAt: -1 }).lean();
};

export const getRuleHistory = async (input: GetAllActiveRulesInput): Promise<ILoyaltyRule[]> => {
  const shopId = await resolveShopId(input.ownerId);
  return LoyaltyRule.find({ shopId }).sort({ createdAt: -1, version: -1 }).lean();
};

export const recordVisitForOwner = async (
  input: MarkVisitInput
): Promise<{ membership: IMembership; visit: IVisit; rewardsEarned: INotification[]; pointsEarned: number }> => {
  const shopId = await resolveShopId(input.ownerId);
  const customer = await User.findOne({ email: input.customerEmail.toLowerCase().trim() }).select('_id').lean();
  if (!customer) throw new AppError('Customer not found with this email', 404);

  const membership = await Membership.findOne({ customerId: customer._id, shopId });
  if (!membership) throw new AppError('This customer has not joined your shop', 404);
  if (!membership.isActive) throw new AppError('This membership is inactive', 403);

  return processVisit(membership, {
    serviceId: input.serviceId,
    markedByMethod: input.markedByMethod ?? 'manual',
    checkinToken: input.checkinToken,
    locationVerified: input.locationVerified,
    spendAmount: input.spendAmount,
    productsBought: input.productsBought,
  });
};

export const recordPosVisit = async (
  input: MarkPosVisitInput
): Promise<{ membership: IMembership; visit: IVisit; rewardsEarned: INotification[]; pointsEarned: number }> => {
  const shopId = toObjectId(input.shopId);
  const shop = await Shop.findById(shopId).select('_id status').lean();
  if (!shop) throw new AppError('Shop not found', 404);
  if (shop.status !== 'active') throw new AppError('Shop is not active', 403);

  const customer = await User.findOne({ email: input.customerEmail.toLowerCase().trim() }).select('_id').lean();
  if (!customer) throw new AppError('Customer not found', 404);

  const membership = await Membership.findOne({ customerId: customer._id, shopId });
  if (!membership) throw new AppError('Customer has not joined this shop', 404);
  if (!membership.isActive) throw new AppError('Membership is inactive', 403);

  return processVisit(membership, {
    serviceId: input.serviceId,
    markedByMethod: 'plugin',
    checkinToken: input.checkinToken,
    locationVerified: input.locationVerified,
    spendAmount: input.spendAmount,
    productsBought: input.productsBought,
  });
};

export const getVisitHistory = async (
  input: VisitHistoryInput
): Promise<PaginatedResult<IVisit>> => {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;
  const membership = await Membership.findById(input.membershipId).lean();
  if (!membership) throw new AppError('Membership not found', 404);

  const shopId = await resolveShopId(input.requesterId);
  if (shopId.toString() !== membership.shopId.toString()) {
    throw new AppError('Unauthorized to view this visit history', 403);
  }

  const [items, total] = await Promise.all([
    Visit.find({ membershipId: membership._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Visit.countDocuments({ membershipId: membership._id }),
  ]);

  return paginate(items as IVisit[], total, page, limit);
};

export const getShopMembers = async (
  input: ShopMembersInput
): Promise<PaginatedResult<IMembership>> => {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;
  const shopId = await resolveShopId(input.ownerId);

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

  return paginate(items as IMembership[], total, page, limit);
};

export const joinShop = async (input: JoinShopInput): Promise<IMembership> => {
  const customerId = toObjectId(input.customerId);
  const shopId = toObjectId(input.shopId);
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

export const getMyMemberships = async (
  input: CustomerMembershipsInput
): Promise<PaginatedResult<MembershipWithShopAndRules>> => {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;
  const filter = { customerId: toObjectId(input.customerId), isActive: true };

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

  return paginate(items as unknown as MembershipWithShopAndRules[], total, page, limit);
};

export const getMembershipCard = async (
  input: CustomerMembershipInput
): Promise<MembershipWithShopAndRules> => {
  const membership = await Membership.findOne({
    customerId: toObjectId(input.customerId),
    shopId: toObjectId(input.shopId),
  })
    .populate('shopId', 'name type address locationLng locationLat logoUrl profilePhoto')
    .populate('ruleProgress.ruleId', 'title loyaltyType config reward version serviceId')
    .lean();

  if (!membership) throw new AppError('Membership not found', 404);
  return membership as unknown as MembershipWithShopAndRules;
};

export const getMyRewards = async (
  input: GetMyRewardsInput
): Promise<PaginatedResult<INotification>> => {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;
  const filter: Record<string, unknown> = {
    customerId: toObjectId(input.customerId),
    type: { $in: ['reward_earned', 'reward_claimed'] },
  };

  const [items, total] = await Promise.all([
    Notification.find(filter)
      .populate('shopId', 'name type')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
  ]);

  return paginate(items as INotification[], total, page, limit);
};

export const redeemReward = async (input: RedeemRewardInput): Promise<INotification> => {
  const shopId = await resolveShopId(input.ownerId);
  const reward = await Notification.findOne({
    _id: toObjectId(input.rewardId),
    shopId,
    type: 'reward_earned',
  });

  if (!reward) throw new AppError('Reward notification not found', 404);

  reward.type = 'reward_claimed';
  reward.isRead = true;
  reward.title = `Claimed: ${reward.title}`;
  await reward.save();

  return reward;
};
