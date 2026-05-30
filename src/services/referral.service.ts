import crypto from 'crypto';
import { Types } from 'mongoose';
import { AppError } from '../middleware/errorHandler.js';
import { LoyaltyRule } from '../models/LoyaltyRule.js';
import { Membership } from '../models/Membership.js';
import { Notification } from '../models/Notification.js';
import { PointsLedger } from '../models/PointsLedger.js';
import { Referral, type IReferral } from '../models/Referral.js';
import { Shop } from '../models/Shop.js';
import { User } from '../models/User.js';
import type {
  ApplyReferralCodeInput,
  EntityId,
  GenerateReferralCodeInput,
  GetReferralsInput,
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
// GENERATE REFERRAL CODE
// ─────────────────────────────────────────────────────────────────────────────

export const generateReferralCode = async (
  input: GenerateReferralCodeInput
): Promise<IReferral> => {
  const customerId = toObjectId(input.customerId);
  const shopId     = toObjectId(input.shopId);

  // verify shop exists and is active
  const shop = await Shop.findById(shopId).select('status name').lean();
  if (!shop)                    throw new AppError('Shop not found', 404);
  if (shop.status !== 'active') throw new AppError('Shop is not active', 403);

  // verify customer is a member of this shop
  const membership = await Membership.findOne({
    customerId,
    shopId,
    isActive: true,
  }).lean();
  if (!membership) throw new AppError('You must be a member of this shop to generate a referral code', 403);

  // check if customer already has an active referral code for this shop
  const existing = await Referral.findOne({
    referrerId: customerId,
    shopId,
    status:     'pending',
    refereeId:  { $exists: false },
  }).lean();

  if (existing) return existing;

  // generate unique code — first 4 chars of customer name + 4 random hex chars
  const customer = await User.findById(customerId).select('name').lean();
  const namePrefix = (customer?.name ?? 'USER')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 4)
    .padEnd(4, 'X');
  const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  const code = `${namePrefix}${randomSuffix}`;

  const referral = await Referral.create({
    referrerId:   customerId,
    shopId,
    referralCode: code,
    status:       'pending',
  });

  return referral;
};

// ─────────────────────────────────────────────────────────────────────────────
// APPLY REFERRAL CODE — called when new customer joins a shop
// ─────────────────────────────────────────────────────────────────────────────

export const applyReferralCode = async (
  input: ApplyReferralCodeInput
): Promise<IReferral> => {
  const newCustomerId = toObjectId(input.newCustomerId);

  // find the referral
  const referral = await Referral.findOne({
    referralCode: input.code.toUpperCase().trim(),
    status:       'pending',
    refereeId:    { $exists: false },
  }).lean();

  if (!referral) throw new AppError('Invalid or already used referral code', 404);

  // prevent self-referral
  if (referral.referrerId.toString() === newCustomerId.toString())
    throw new AppError('You cannot use your own referral code', 400);

  // check customer is not already a member of this shop
  const existing = await Membership.findOne({
    customerId: newCustomerId,
    shopId:     referral.shopId,
    isActive:   true,
  }).lean();

  if (existing) throw new AppError('You are already a member of this shop', 409);

  // store refereeId on the referral — reward fires on first visit
  const updated = await Referral.findByIdAndUpdate(
    referral._id,
    { $set: { refereeId: newCustomerId } },
    { new: true }
  );

  if (!updated) throw new AppError('Referral update failed', 500);
  return updated;
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPLETE REFERRAL — called internally after referee's first visit
// ─────────────────────────────────────────────────────────────────────────────

export const completeReferral = async (
  refereeId: Types.ObjectId,
  shopId:    Types.ObjectId
): Promise<void> => {
  // find pending referral for this referee + shop
  const referral = await Referral.findOne({
    refereeId,
    shopId,
    status: 'pending',
  });

  if (!referral) return; // no referral — nothing to do

  // get referral rule for this shop
  const rule = await LoyaltyRule.findOne({
    shopId,
    loyaltyType: 'referral',
    isActive:    true,
  }).lean();

  if (!rule) {
    // no referral rule — just mark completed with no points
    referral.status = 'completed';
    await referral.save();
    return;
  }

  const referrerPoints = rule.config?.referrer_points ?? 0;
  const refereePoints  = rule.config?.referee_points  ?? 0;

  // update referrer membership points
  if (referrerPoints > 0) {
    await Membership.findOneAndUpdate(
      { customerId: referral.referrerId, shopId, isActive: true },
      { $inc: { totalPoints: referrerPoints } }
    );

    await PointsLedger.create({
      customerId:   referral.referrerId,
      shopId,
      action:       'referral',
      source:       'referral',
      points:       referrerPoints,
      balanceAfter: 0, // will be recalculated
      note:         `Referral bonus — referred a new member`,
    });

    await Notification.create({
      customerId: referral.referrerId,
      shopId,
      type:       'referral',
      title:      'Referral reward!',
      message:    `You earned ${referrerPoints} points for referring a friend.`,
      isRead:     false,
      emailSent:  false,
    });
  }

  // update referee membership points
  if (refereePoints > 0) {
    await Membership.findOneAndUpdate(
      { customerId: refereeId, shopId, isActive: true },
      { $inc: { totalPoints: refereePoints } }
    );

    await PointsLedger.create({
      customerId:   refereeId,
      shopId,
      action:       'referral',
      source:       'referral',
      points:       refereePoints,
      balanceAfter: 0,
      note:         `Referral bonus — joined via referral code`,
    });

    await Notification.create({
      customerId: refereeId,
      shopId,
      type:       'referral',
      title:      'Welcome bonus!',
      message:    `You earned ${refereePoints} points for joining via referral.`,
      isRead:     false,
      emailSent:  false,
    });
  }

  // mark referral as rewarded
  referral.status = 'rewarded';
  await referral.save();
};

// ─────────────────────────────────────────────────────────────────────────────
// GET REFERRALS
// ─────────────────────────────────────────────────────────────────────────────

export const getReferrals = async (
  input: GetReferralsInput
): Promise<PaginatedResult<IReferral>> => {
  const page  = input.page ?? 1;
  const limit = input.limit ?? 20;

  const filter: Record<string, unknown> = {
    referrerId: toObjectId(input.customerId),
  };
  if (input.shopId) filter.shopId = toObjectId(input.shopId);

  const [items, total] = await Promise.all([
    Referral.find(filter)
      .populate('shopId',    'name type businessType logoUrl')
      .populate('refereeId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Referral.countDocuments(filter),
  ]);

  return paginate(items as IReferral[], total, page, limit);
};