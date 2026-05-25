import { Types } from 'mongoose';
import { AppError } from '../middleware/errorHandler.js';
import { CheckinToken } from '../models/CheckinToken.js';
import { LoyaltyRule, type ILoyaltyRule } from '../models/LoyaltyRule.js';
import { Membership, type IMembership } from '../models/Membership.js';
import { Notification, type INotification } from '../models/Notification.js';
import { PointsLedger } from '../models/PointsLedger.js';
import { Shop } from '../models/Shop.js';
import { User } from '../models/User.js';
import { Visit, type IVisit } from '../models/Visit.js';
import type { MarkedByMethod } from '../models/enums.js';
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

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const paginate = <T>(items: T[], total: number, page = 1, limit = 20): PaginatedResult<T> => ({
  items,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});

const toObjectId = (id: EntityId): Types.ObjectId =>
  new Types.ObjectId(id.toString());

const resolveShopId = async (ownerId: EntityId): Promise<Types.ObjectId> => {
  const shop = await Shop.findOne({ ownerId: toObjectId(ownerId) })
    .select('_id')
    .lean();
  if (!shop) throw new AppError('Shop not found for this owner', 404);
  return shop._id as Types.ObjectId;
};

const getNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const calculateProductPoints = (
  products: MarkVisitInput['productsBought'] = []
): number =>
  products.reduce(
    (sum, product) => sum + getNumber(product.points) * product.quantity,
    0
  );

// ─────────────────────────────────────────────────────────────────────────────
// FIX 5 — event multiplier was multiplying by 0
// now correctly applies multiplier to base points
// ─────────────────────────────────────────────────────────────────────────────

const calculateVisitPoints = (
  rule: ILoyaltyRule,
  spendAmount = 0,
  products: MarkVisitInput['productsBought'] = []
): number => {
  const config = rule.config ?? {};

  const basePoints =
    getNumber(config.points_per_visit) +
    getNumber(config.points_per_spend) * spendAmount +
    calculateProductPoints(products);

  // apply event multiplier if this is an event rule
  // default multiplier is 1 (no change)
  const multiplier =
    rule.loyaltyType === 'event'
      ? getNumber(config.points_multiplier, 1)
      : 1;

  return Math.floor(basePoints * multiplier);
};

const isRuleCompleted = (
  rule: ILoyaltyRule,
  progress: IMembership['ruleProgress'][number]
): boolean => {
  const config = rule.config ?? {};

  switch (rule.loyaltyType) {
    case 'visit':
      return (
        progress.visitCount >=
        getNumber(config.visit_count_target, Number.MAX_SAFE_INTEGER)
      );
    case 'points':
      return (
        progress.pointsCount >=
        getNumber(config.points_target, Number.MAX_SAFE_INTEGER)
      );
    case 'spend':
      return (
        progress.spendCount >=
        getNumber(config.spend_target, Number.MAX_SAFE_INTEGER)
      );
    case 'hybrid':
      return (
        progress.visitCount >=
          getNumber(config.visits_needed, Number.MAX_SAFE_INTEGER) &&
        progress.pointsCount >=
          getNumber(config.points_needed, Number.MAX_SAFE_INTEGER)
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
    shopId:     membership.shopId,
    type:       'reward_earned',
    title:      rule.title,
    message:    rule.reward?.value ?? 'Reward earned',
    isRead:     false,
    emailSent:  false,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// FIX 1 — token verification
// ─────────────────────────────────────────────────────────────────────────────

const verifyCheckinToken = async (
  token: string,
  customerId: Types.ObjectId,
  shopId: Types.ObjectId
): Promise<void> => {
  const checkinToken = await CheckinToken.findOne({ token }).lean();

  if (!checkinToken)
    throw new AppError('Invalid check-in token', 401);

  if (checkinToken.isUsed)
    throw new AppError('This check-in token has already been used', 401);

  if (new Date() > checkinToken.expiresAt)
    throw new AppError('Check-in token has expired', 401);

  if (checkinToken.customerId.toString() !== customerId.toString())
    throw new AppError('Token does not belong to this customer', 401);

  // mark token as used immediately — prevents replay attacks
  await CheckinToken.findByIdAndUpdate(checkinToken._id, {
    $set: {
      isUsed:  true,
      usedAt:  new Date(),
    },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// FIX 2 — GPS fraud check
// ─────────────────────────────────────────────────────────────────────────────

const verifyCustomerLocation = async (
  shopId: Types.ObjectId,
  customerLat?: number,
  customerLng?: number
): Promise<boolean> => {
  // if no location provided — skip check
  // locationVerified will be false on the visit record
  if (customerLat === undefined || customerLng === undefined) return false;

  const shop = await Shop.findById(shopId)
    .select('location checkinRadius')
    .lean();
  if (!shop) return false;

  const [shopLng, shopLat] = shop.location.coordinates;
  const radius = shop.checkinRadius ?? 100;

  // haversine formula — distance in meters between two GPS points
  const R = 6371000;
  const dLat = ((customerLat - shopLat) * Math.PI) / 180;
  const dLng = ((customerLng - shopLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((shopLat * Math.PI) / 180) *
      Math.cos((customerLat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  if (distance > radius)
    throw new AppError(
      `Customer is too far from the shop (${Math.round(distance)}m away, limit is ${radius}m)`,
      403
    );

  return true;
};

// ─────────────────────────────────────────────────────────────────────────────
// FIX 3 — daily visit limit
// ─────────────────────────────────────────────────────────────────────────────

const checkDailyVisitLimit = async (
  customerId: Types.ObjectId,
  shopId: Types.ObjectId
): Promise<void> => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const existing = await Visit.findOne({
    customerId,
    shopId,
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  }).lean();

  if (existing)
    throw new AppError(
      'This customer has already been checked in today',
      409
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// FIX 4 — tier upgrade check
// ─────────────────────────────────────────────────────────────────────────────

const evaluateTierUpgrade = async (
  membership: IMembership,
  updatedPoints: number
): Promise<void> => {
  // get tier rule for this shop if it exists
  const tierRule = await LoyaltyRule.findOne({
    shopId:      membership.shopId,
    loyaltyType: 'tier',
    isActive:    true,
  }).lean();

  if (!tierRule || !tierRule.config?.tiers?.length) return;

  // sort tiers by min_points descending — highest tier first
  const sortedTiers = [...tierRule.config.tiers].sort(
    (a, b) => b.min_points - a.min_points
  );

  // find the highest tier the customer qualifies for
  const newTier = sortedTiers.find(
    (tier) => updatedPoints >= tier.min_points
  );

  if (!newTier) return;

  const currentTier = membership.tierLevel;
  if (newTier.name.toLowerCase() === currentTier) return;

  // upgrade the tier
  await Membership.findByIdAndUpdate(membership._id, {
    $set: { tierLevel: newTier.name.toLowerCase() },
  });

  // notify the customer
  await Notification.create({
    customerId: membership.customerId,
    shopId:     membership.shopId,
    type:       'tier_upgrade',
    title:      `You reached ${newTier.name}!`,
    message:    `Congratulations! You are now a ${newTier.name} member. ${newTier.reward_value}`,
    isRead:     false,
    emailSent:  false,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// CORE VISIT PROCESSOR — all 5 fixes applied
// ─────────────────────────────────────────────────────────────────────────────

const processVisit = async (
  membership: IMembership,
  input: {
    serviceId?:       EntityId;
    markedByMethod:   MarkedByMethod;
    checkinToken?:    string;
    locationVerified?: boolean;
    customerLat?:     number;
    customerLng?:     number;
    spendAmount?:     number;
    productsBought?:  MarkVisitInput['productsBought'];
  }
): Promise<{
  membership:    IMembership;
  visit:         IVisit;
  rewardsEarned: INotification[];
  pointsEarned:  number;
}> => {
  const customerId     = membership.customerId as Types.ObjectId;
  const shopId         = membership.shopId as Types.ObjectId;
  const spendAmount    = input.spendAmount ?? 0;
  const productsBought = input.productsBought ?? [];

  // FIX 3 — daily visit limit check
  await checkDailyVisitLimit(customerId, shopId);

  // FIX 1 — verify token if qr_scan or barcode_scan
  if (
    input.checkinToken &&
    (input.markedByMethod === 'qr_scan' ||
      input.markedByMethod === 'barcode_scan')
  ) {
    await verifyCheckinToken(input.checkinToken, customerId, shopId);
  }

  // FIX 2 — GPS fraud check
  const locationVerified = await verifyCustomerLocation(
    shopId,
    input.customerLat,
    input.customerLng
  ).catch(() => false);  // if GPS check fails — allow visit but mark unverified

  const rewardsEarned: INotification[] = [];
  let totalPointsEarned = 0;

  const activeRules = await LoyaltyRule.find({
    shopId,
    ...(input.serviceId ? { serviceId: toObjectId(input.serviceId) } : {}),
    isActive: true,
  });

  const progressByRule = new Map(
    membership.ruleProgress.map((p) => [p.ruleId.toString(), p])
  );
  const updatedProgress = [...membership.ruleProgress];

  for (const rule of activeRules) {
    let progress = progressByRule.get(String(rule._id));

    if (!progress) {
      progress = {
        ruleId:      rule._id as Types.ObjectId,
        visitCount:  0,
        pointsCount: 0,
        spendCount:  0,
        version:     rule.version,
        status:      'active',
      };
      updatedProgress.push(progress);
      progressByRule.set(String(rule._id), progress);
    }

    if (progress.status !== 'active') continue;

    progress.visitCount += 1;
    progress.spendCount += spendAmount;

    // FIX 5 — event multiplier now applied correctly
    const pointsFromRule = calculateVisitPoints(
      rule,
      spendAmount,
      productsBought
    );
    progress.pointsCount  += pointsFromRule;
    totalPointsEarned     += pointsFromRule;

    if (isRuleCompleted(rule, progress)) {
      progress.status = 'completed';
      rewardsEarned.push(await createRewardNotification(membership, rule));
    }
  }

  const visit = await Visit.create({
    customerId,
    shopId,
    membershipId:    membership._id,
    markedByMethod:  input.markedByMethod,
    checkinToken:    input.checkinToken,
    locationVerified,
    spendAmount,
    pointsEarned:    totalPointsEarned,
    productsBought,
  });

  const updatedMembership = await Membership.findByIdAndUpdate(
    membership._id,
    {
      $set: {
        ruleProgress: updatedProgress,
        lastVisitAt:  new Date(),
      },
      $inc: {
        totalVisits:  1,
        totalPoints:  totalPointsEarned,
        totalSpend:   spendAmount,
      },
    },
    { new: true, runValidators: true }
  );

  if (!updatedMembership)
    throw new AppError('Membership update failed', 500);

  if (totalPointsEarned > 0) {
    await PointsLedger.create({
      customerId,
      shopId,
      serviceId:   input.serviceId ? toObjectId(input.serviceId) : undefined,
      visitRef:    visit._id,
      action:      'earn',
      source:
        spendAmount > 0
          ? 'spend'
          : productsBought.length
          ? 'product'
          : 'visit',
      points:      totalPointsEarned,
      spendAmount,
      balanceAfter: updatedMembership.totalPoints,
      note:        'Visit points earned',
    });
  }

  // FIX 4 — tier upgrade check after points updated
  await evaluateTierUpgrade(updatedMembership, updatedMembership.totalPoints);

  await Notification.create({
    customerId,
    shopId,
    type:    'visit_marked',
    title:   'Visit marked',
    message: 'Your loyalty visit was recorded.',
    isRead:  false,
    emailSent: false,
  });

  return {
    membership:    updatedMembership,
    visit,
    rewardsEarned,
    pointsEarned:  totalPointsEarned,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// LOYALTY RULES
// ─────────────────────────────────────────────────────────────────────────────

export const createOrUpdateRuleForOwner = async (
  input: CreateOrUpdateLoyaltyRuleInput
): Promise<ILoyaltyRule> => {
  const shopId    = await resolveShopId(input.ownerId);
  const serviceId = input.serviceId ? toObjectId(input.serviceId) : undefined;
  const config    = { ...input.config };
  const reward    = input.reward ?? {
    type:  'voucher',
    value: input.rewardDescription ?? 'Reward',
  };

  if (input.visitsRequired && !config.visit_count_target) {
    config.visit_count_target = input.visitsRequired;
  }

  const existingRule = await LoyaltyRule.findOne({
    shopId,
    ...(serviceId ? { serviceId } : {}),
    title:    { $regex: new RegExp(`^${input.title}$`, 'i') },
    isActive: true,
  });

  if (existingRule) {
    existingRule.isActive = false;
    await existingRule.save();
  }

  const newRule = await LoyaltyRule.create({
    shopId,
    serviceId,
    title:             input.title,
    loyaltyType:       input.loyaltyType,
    config,
    reward,
    rewardDescription: reward.value,
    visitsRequired:    config.visit_count_target,
    version:           existingRule ? existingRule.version + 1 : 1,
    isActive:          true,
  });

  await Membership.updateMany(
    { shopId, isActive: true },
    {
      $push: {
        ruleProgress: {
          ruleId:      newRule._id,
          visitCount:  0,
          pointsCount: 0,
          spendCount:  0,
          version:     newRule.version,
          status:      'active',
        },
      },
    }
  );

  return newRule;
};

export const getAllActiveRules = async (
  input: GetAllActiveRulesInput
): Promise<ILoyaltyRule[]> => {
  const shopId = await resolveShopId(input.ownerId);
  return LoyaltyRule.find({ shopId, isActive: true })
    .sort({ createdAt: -1 })
    .lean();
};

export const getRuleHistory = async (
  input: GetAllActiveRulesInput
): Promise<ILoyaltyRule[]> => {
  const shopId = await resolveShopId(input.ownerId);
  return LoyaltyRule.find({ shopId })
    .sort({ createdAt: -1, version: -1 })
    .lean();
};

// ─────────────────────────────────────────────────────────────────────────────
// VISIT MARKING
// ─────────────────────────────────────────────────────────────────────────────

export const recordVisitForOwner = async (
  input: MarkVisitInput
): Promise<{
  membership:    IMembership;
  visit:         IVisit;
  rewardsEarned: INotification[];
  pointsEarned:  number;
}> => {
  const shopId   = await resolveShopId(input.ownerId);
  const customer = await User.findOne({
    email: input.customerEmail.toLowerCase().trim(),
  })
    .select('_id')
    .lean();
  if (!customer)
    throw new AppError('Customer not found with this email', 404);

  const membership = await Membership.findOne({
    customerId: customer._id,
    shopId,
  });
  if (!membership)
    throw new AppError('This customer has not joined your shop', 404);
  if (!membership.isActive)
    throw new AppError('This membership is inactive', 403);

  return processVisit(membership, {
    serviceId:       input.serviceId,
    markedByMethod:  input.markedByMethod ?? 'manual',
    checkinToken:    input.checkinToken,
    customerLat:     input.customerLat,
    customerLng:     input.customerLng,
    spendAmount:     input.spendAmount,
    productsBought:  input.productsBought,
  });
};

export const recordPosVisit = async (
  input: MarkPosVisitInput
): Promise<{
  membership:    IMembership;
  visit:         IVisit;
  rewardsEarned: INotification[];
  pointsEarned:  number;
}> => {
  const shopId = toObjectId(input.shopId);
  const shop   = await Shop.findById(shopId).select('_id status').lean();
  if (!shop)                    throw new AppError('Shop not found', 404);
  if (shop.status !== 'active') throw new AppError('Shop is not active', 403);

  const customer = await User.findOne({
    email: input.customerEmail.toLowerCase().trim(),
  })
    .select('_id')
    .lean();
  if (!customer) throw new AppError('Customer not found', 404);

  const membership = await Membership.findOne({
    customerId: customer._id,
    shopId,
  });
  if (!membership)          throw new AppError('Customer has not joined this shop', 404);
  if (!membership.isActive) throw new AppError('Membership is inactive', 403);

  return processVisit(membership, {
    serviceId:      input.serviceId,
    markedByMethod: 'plugin',
    checkinToken:   input.checkinToken,
    spendAmount:    input.spendAmount,
    productsBought: input.productsBought,
  });
};

export const getVisitHistory = async (
  input: VisitHistoryInput
): Promise<PaginatedResult<IVisit>> => {
  const page  = input.page ?? 1;
  const limit = input.limit ?? 20;

  const membership = await Membership.findById(input.membershipId).lean();
  if (!membership) throw new AppError('Membership not found', 404);

  const shopId = await resolveShopId(input.requesterId);
  if (shopId.toString() !== membership.shopId.toString())
    throw new AppError('Unauthorized to view this visit history', 403);

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

// ─────────────────────────────────────────────────────────────────────────────
// MEMBERS
// ─────────────────────────────────────────────────────────────────────────────

export const getShopMembers = async (
  input: ShopMembersInput
): Promise<PaginatedResult<IMembership>> => {
  const page  = input.page ?? 1;
  const limit = input.limit ?? 20;
  const shopId = await resolveShopId(input.ownerId);

  let customerIds: Types.ObjectId[] | undefined;
  if (input.search) {
    const customers = await User.find({
      $or: [
        { name:  { $regex: input.search, $options: 'i' } },
        { email: { $regex: input.search, $options: 'i' } },
        { phone: { $regex: input.search, $options: 'i' } },
      ],
    })
      .select('_id')
      .lean();
    customerIds = customers.map((c) => c._id as Types.ObjectId);
  }

  const filter: Record<string, unknown> = { shopId, isActive: true };
  if (customerIds) filter.customerId = { $in: customerIds };

  const [items, total] = await Promise.all([
    Membership.find(filter)
      .populate('customerId', 'name email phone profilePhoto')
      .populate(
        'ruleProgress.ruleId',
        'title loyaltyType config reward version serviceId'
      )
      .sort({ lastVisitAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Membership.countDocuments(filter),
  ]);

  return paginate(items as IMembership[], total, page, limit);
};

// ─────────────────────────────────────────────────────────────────────────────
// MEMBERSHIP
// ─────────────────────────────────────────────────────────────────────────────

export const joinShop = async (
  input: JoinShopInput
): Promise<IMembership> => {
  const customerId = toObjectId(input.customerId);
  const shopId     = toObjectId(input.shopId);

  const shop = await Shop.findById(shopId).select('status').lean();
  if (!shop)                    throw new AppError('Shop not found', 404);
  if (shop.status !== 'active') throw new AppError('This shop is not active', 403);

  const existing = await Membership.findOne({ customerId, shopId }).lean();
  if (existing) throw new AppError('You are already a member of this shop', 409);

  const activeRules = await LoyaltyRule.find({ shopId, isActive: true }).lean();

  return Membership.create({
    customerId,
    shopId,
    ruleProgress: activeRules.map((rule) => ({
      ruleId:      rule._id,
      visitCount:  0,
      pointsCount: 0,
      spendCount:  0,
      version:     rule.version,
      status:      'active',
    })),
    totalVisits: 0,
    totalPoints: 0,
    totalSpend:  0,
    tierLevel:   'none',
    joinedAt:    new Date(),
    isActive:    true,
  });
};

export const getMyMemberships = async (
  input: CustomerMembershipsInput
): Promise<PaginatedResult<MembershipWithShopAndRules>> => {
  const page   = input.page ?? 1;
  const limit  = input.limit ?? 20;
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

  return paginate(
    items as unknown as MembershipWithShopAndRules[],
    total,
    page,
    limit
  );
};

export const getMembershipCard = async (
  input: CustomerMembershipInput
): Promise<MembershipWithShopAndRules> => {
  const membership = await Membership.findOne({
    customerId: toObjectId(input.customerId),
    shopId:     toObjectId(input.shopId),
  })
    .populate('shopId', 'name type address locationLng locationLat logoUrl profilePhoto')
    .populate('ruleProgress.ruleId', 'title loyaltyType config reward version serviceId')
    .lean();

  if (!membership) throw new AppError('Membership not found', 404);
  return membership as unknown as MembershipWithShopAndRules;
};

// ─────────────────────────────────────────────────────────────────────────────
// REWARDS
// ─────────────────────────────────────────────────────────────────────────────

export const getMyRewards = async (
  input: GetMyRewardsInput
): Promise<PaginatedResult<INotification>> => {
  const page  = input.page ?? 1;
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

export const redeemReward = async (
  input: RedeemRewardInput
): Promise<INotification> => {
  const shopId = await resolveShopId(input.ownerId);
  const reward = await Notification.findOne({
    _id:  toObjectId(input.rewardId),
    shopId,
    type: 'reward_earned',
  });

  if (!reward) throw new AppError('Reward notification not found', 404);

  reward.type    = 'reward_claimed';
  reward.isRead  = true;
  reward.title   = `Claimed: ${reward.title}`;
  await reward.save();

  return reward;
};