import { Types }                         from 'mongoose';
import { LoyaltyRule, ILoyaltyRule }     from '../models/LoyaltyRule.js';
import { Membership, IMembership }       from '../models/Membership.js';
import { Visit, IVisit }                 from '../models/Visit.js';
import { Reward, IReward }               from '../models/Reward.js';
import { Shop }                          from '../models/Shop.js';
import { User }                          from '../models/User.js';
import type {
  CreateOrUpdateLoyaltyRuleInput,
  CustomerMembershipInput,
  CustomerMembershipsInput,
  EntityId,
  GetAllActiveRulesInput,
  GetMyRewardsInput,
  GetRuleHistoryInput,
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

const paginate = <T>(
  items: T[],
  total: number,
  page:  number,
  limit: number
): PaginatedResult<T> => ({
  items,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});

const resolveShopId = async (ownerId: EntityId): Promise<Types.ObjectId> => {
  const shop = await Shop.findOne({
    ownerId: new Types.ObjectId(ownerId.toString()),
  }).select('_id').lean();

  if (!shop) throw new Error('Shop not found for this owner');
  return shop._id as Types.ObjectId;
};

const isAlreadyVisitedToday = async (
  customerId: Types.ObjectId,
  shopId:     Types.ObjectId
): Promise<boolean> => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const existing = await Visit.findOne({
    customerId,
    shopId,
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  }).lean();

  return !!existing;
};

/**
 * Core visit logic — processes ONE visit across ALL active rules
 *
 * For each rule in membership.ruleProgress:
 *   → increment visitCount
 *   → if visitCount >= rule.visitsRequired → reward earned → reset count
 *
 * One visit can earn multiple rewards simultaneously
 */
const processVisit = async (
  membership: IMembership,
  shopId:     Types.ObjectId,
  markedById: Types.ObjectId,
): Promise<{
  membership:    IMembership;
  rewardsEarned: IReward[];
}> => {
  const rewardsEarned: IReward[] = [];
  const updatedProgress          = [...membership.ruleProgress];

  for (let i = 0; i < updatedProgress.length; i++) {
    const progress = updatedProgress[i];

    // Get the rule for this progress entry
    const rule = await LoyaltyRule.findById(progress.ruleId).lean();
    if (!rule || !rule.isActive) continue; // skip deactivated rules

    progress.visitCount += 1;

    if (progress.visitCount >= rule.visitsRequired) {
      // Reward earned for this rule
      const reward = await Reward.create({
        membershipId:  membership._id,
        shopId,
        customerId:    membership.customerId,
        ruleVersionId: rule._id,
        earnedAt:      new Date(),
        status:        'pending',
      });

      rewardsEarned.push(reward);

      // Reset only this rule's count
      progress.visitCount = 0;
    }
  }

  // Record the visit document
  // Use first active rule as the primary ruleVersionId for audit
  const primaryRule = updatedProgress.find(p => p.visitCount >= 0);
  await Visit.create({
    membershipId:  membership._id,
    shopId,
    customerId:    membership.customerId,
    markedBy:      markedById,
    ruleVersionId: primaryRule?.ruleId ?? membership.ruleProgress[0]?.ruleId,
  });

  // Save updated progress + membership fields
  const updatedMembership = await Membership.findByIdAndUpdate(
    membership._id,
    {
      $set: {
        ruleProgress: updatedProgress,
        lastVisitAt:  new Date(),
      },
      $inc: { totalVisits: 1 },
    },
    { new: true }
  ) as IMembership;

  return { membership: updatedMembership, rewardsEarned };
};

// ─────────────────────────────────────────────────────────────────────────────
// LOYALTY RULES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new rule OR update an existing one
 *
 * If title matches existing rule → version it (deactivate old, create new)
 * If new title → brand new rule added to shop
 *
 * Existing member progress on old version is preserved
 */
export const createOrUpdateRuleForOwner = async (
  input: CreateOrUpdateLoyaltyRuleInput
): Promise<ILoyaltyRule> => {
  const { ownerId, title, visitsRequired, rewardDescription } = input;

  const shopId = await resolveShopId(ownerId);

  // Check if a rule with this title already exists for this shop
  const existingRule = await LoyaltyRule.findOne({
    shopId,
    title:    { $regex: new RegExp(`^${title}$`, 'i') },
    isActive: true,
  }).lean();

  if (existingRule) {
    // Version it — deactivate old, create new version
    await LoyaltyRule.findByIdAndUpdate(
      existingRule._id,
      { $set: { isActive: false } }
    );

    const newRule = await LoyaltyRule.create({
      shopId,
      title,
      visitsRequired,
      rewardDescription,
      version:  existingRule.version + 1,
      isActive: true,
    });

    // Note: existing members keep old ruleId in ruleProgress
    // They get upgraded to new version after redeeming current cycle

    return newRule;
  }

  // Brand new rule for this shop
  // Count existing rules to set version = 1
  const newRule = await LoyaltyRule.create({
    shopId,
    title,
    visitsRequired,
    rewardDescription,
    version:  1,
    isActive: true,
  });

  // Add this new rule to ALL existing memberships for this shop
  // with visitCount: 0 so they start fresh on this new rule
  await Membership.updateMany(
    { shopId, isActive: true },
    {
      $push: {
        ruleProgress: {
          ruleId:     newRule._id,
          visitCount: 0,
          version:    1,
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
): Promise<{ membership: IMembership; rewardsEarned: IReward[] }> => {
  const { ownerId, customerEmail } = input;

  const shopId = await resolveShopId(ownerId);

  // Find customer by email
  const customer = await User.findOne({
    email: customerEmail.toLowerCase().trim(),
  }).select('_id').lean();
  if (!customer) throw new Error('Customer not found with this email');

  const customerId = customer._id as Types.ObjectId;

  // Find membership
  const membership = await Membership.findOne({ customerId, shopId });
  if (!membership)        throw new Error('This customer has not joined your shop');
  if (!membership.isActive) throw new Error('This membership is inactive');

  // One visit per day
  const alreadyVisited = await isAlreadyVisitedToday(customerId, shopId);
  if (alreadyVisited) throw new Error('This customer has already been marked today');

  // Must have at least one rule to track progress
  if (!membership.ruleProgress.length) {
    throw new Error('This shop has no active loyalty rules');
  }

  return processVisit(
    membership,
    shopId,
    new Types.ObjectId(ownerId.toString()),
  );
};

export const recordPosVisit = async (
  input: MarkPosVisitInput
): Promise<{ membership: IMembership; rewardsEarned: IReward[] }> => {
  const { shopId, markedById, customerEmail } = input;

  const shopObjectId = new Types.ObjectId(shopId.toString());

  const shop = await Shop.findById(shopObjectId).select('_id status').lean();
  if (!shop)                   throw new Error('Shop not found');
  if (shop.status !== 'active') throw new Error('Shop is not active');

  const customer = await User.findOne({
    email: customerEmail.toLowerCase().trim(),
  }).select('_id').lean();
  if (!customer) throw new Error('Customer not found');

  const customerId = customer._id as Types.ObjectId;

  const membership = await Membership.findOne({ customerId, shopId: shopObjectId });
  if (!membership)          throw new Error('Customer has not joined this shop');
  if (!membership.isActive)  throw new Error('Membership is inactive');

  const alreadyVisited = await isAlreadyVisitedToday(customerId, shopObjectId);
  if (alreadyVisited) throw new Error('Customer already visited today');

  if (!membership.ruleProgress.length) {
    throw new Error('This shop has no active loyalty rules');
  }

  return processVisit(
    membership,
    shopObjectId,
    new Types.ObjectId(markedById.toString()),
  );
};

export const getVisitHistory = async (
  input: VisitHistoryInput
): Promise<PaginatedResult<IVisit>> => {
  const { membershipId, requesterId, page = 1, limit = 20 } = input;

  const membership = await Membership.findById(membershipId).lean();
  if (!membership) throw new Error('Membership not found');

  // Verify requester owns this shop
  const shopId = await resolveShopId(requesterId).catch(() => null);
  if (!shopId || shopId.toString() !== membership.shopId.toString()) {
    throw new Error('Unauthorized to view this visit history');
  }

  const [items, total] = await Promise.all([
    Visit.find({ membershipId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Visit.countDocuments({ membershipId }),
  ]);

  return paginate(items as IVisit[], total, page, limit);
};

// ─────────────────────────────────────────────────────────────────────────────
// MEMBERS
// ─────────────────────────────────────────────────────────────────────────────

export const getShopMembers = async (
  input: ShopMembersInput
): Promise<PaginatedResult<IMembership>> => {
  const { ownerId, search, page = 1, limit = 20 } = input;

  const shopId = await resolveShopId(ownerId);

  let customerIds: Types.ObjectId[] | undefined;
  if (search) {
    const customers = await User.find({
      $or: [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ],
    }).select('_id').lean();

    customerIds = customers.map((c) => c._id as Types.ObjectId);
  }

  const filter: Record<string, unknown> = { shopId, isActive: true };
  if (customerIds) filter.customerId = { $in: customerIds };

  const [items, total] = await Promise.all([
    Membership.find(filter)
      .populate('customerId', 'name email phone avatarUrl')
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
  const { customerId, shopId } = input;

  const shopObjectId     = new Types.ObjectId(shopId.toString());
  const customerObjectId = new Types.ObjectId(customerId.toString());

  // Verify shop is active
  const shop = await Shop.findById(shopObjectId).select('status').lean();
  if (!shop)                    throw new Error('Shop not found');
  if (shop.status !== 'active')  throw new Error('This shop is not active');

  // Check already a member
  const existing = await Membership.findOne({
    customerId: customerObjectId,
    shopId:     shopObjectId,
  }).lean();
  if (existing) throw new Error('You are already a member of this shop');

  // Get ALL active rules for this shop
  const activeRules = await LoyaltyRule.find({
    shopId:   shopObjectId,
    isActive: true,
  }).lean();

  // Initialize progress for every active rule
  const ruleProgress = activeRules.map((rule) => ({
    ruleId:     rule._id,
    visitCount: 0,
    version:    rule.version,
  }));

  const membership = await Membership.create({
    customerId:  customerObjectId,
    shopId:      shopObjectId,
    ruleProgress,
    totalVisits: 0,
    joinedAt:    new Date(),
    isActive:    true,
  });

  return membership;
};

export const getMyMemberships = async (
  input: CustomerMembershipsInput
): Promise<PaginatedResult<MembershipWithShopAndRules>> => {
  const { customerId, page = 1, limit = 20 } = input;

  const [items, total] = await Promise.all([
    Membership.find({
      customerId: new Types.ObjectId(customerId.toString()),
      isActive:   true,
    })
      .populate('shopId',                'name category logoUrl address')
      .populate('ruleProgress.ruleId',   'title visitsRequired rewardDescription version')
      .sort({ lastVisitAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Membership.countDocuments({
      customerId: new Types.ObjectId(customerId.toString()),
      isActive:   true,
    }),
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
  const { customerId, shopId } = input;

  const membership = await Membership.findOne({
    customerId: new Types.ObjectId(customerId.toString()),
    shopId:     new Types.ObjectId(shopId.toString()),
  })
    .populate('shopId',              'name category logoUrl address')
    .populate('ruleProgress.ruleId', 'title visitsRequired rewardDescription version')
    .lean();

  if (!membership) throw new Error('Membership not found');

  return membership as unknown as MembershipWithShopAndRules;
};

// ─────────────────────────────────────────────────────────────────────────────
// REWARDS
// ─────────────────────────────────────────────────────────────────────────────

export const getMyRewards = async (
  input: GetMyRewardsInput
): Promise<PaginatedResult<IReward>> => {
  const { customerId, page = 1, limit = 20, status } = input;

  const filter: Record<string, unknown> = {
    customerId: new Types.ObjectId(customerId.toString()),
  };
  if (status) filter.status = status;

  const [items, total] = await Promise.all([
    Reward.find(filter)
      .populate('shopId',        'name logoUrl')
      .populate('ruleVersionId', 'title rewardDescription')
      .sort({ earnedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Reward.countDocuments(filter),
  ]);

  return paginate(items as IReward[], total, page, limit);
};

export const redeemReward = async (
  input: RedeemRewardInput
): Promise<IReward> => {
  const { rewardId, ownerId } = input;

  const shopId = await resolveShopId(ownerId);

  const reward = await Reward.findOne({
    _id:    new Types.ObjectId(rewardId.toString()),
    shopId,
  });
  if (!reward)                      throw new Error('Reward not found');
  if (reward.status === 'redeemed')  throw new Error('Reward already redeemed');

  // Mark redeemed
  reward.status     = 'redeemed';
  reward.redeemedAt = new Date();
  await reward.save();

  // After redemption — upgrade this rule's version in membership
  // to the latest active version of that same rule title
  const redeemedRule = await LoyaltyRule.findById(
    reward.ruleVersionId
  ).lean();

  if (redeemedRule) {
    const latestVersion = await LoyaltyRule.findOne({
      shopId,
      title:    redeemedRule.title,
      isActive: true,
    }).lean();

    if (
      latestVersion &&
      latestVersion.version > redeemedRule.version
    ) {
      // Upgrade this specific rule entry in ruleProgress
      await Membership.findOneAndUpdate(
        {
          _id:                   reward.membershipId,
          'ruleProgress.ruleId': reward.ruleVersionId,
        },
        {
          $set: {
            'ruleProgress.$.ruleId':  latestVersion._id,
            'ruleProgress.$.version': latestVersion.version,
          },
        }
      );
    }
  }

  return reward;
};