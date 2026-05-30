import { Types } from 'mongoose';
import { AppError } from '../middleware/errorHandler.js';
import { LoyaltyRule } from '../models/LoyaltyRule.js';
import { Membership } from '../models/Membership.js';
import type {
  EntityId,
  GetTierStatusInput,
  GetTierStatusResult,
} from './types.js';

const toObjectId = (id: EntityId): Types.ObjectId =>
  new Types.ObjectId(id.toString());

// ─────────────────────────────────────────────────────────────────────────────
// GET TIER STATUS FOR A MEMBERSHIP
// ─────────────────────────────────────────────────────────────────────────────

export const getTierStatus = async (
  input: GetTierStatusInput
): Promise<GetTierStatusResult> => {
  const customerId = toObjectId(input.customerId);
  const shopId     = toObjectId(input.shopId);

  const membership = await Membership.findOne({
    customerId,
    shopId,
    isActive: true,
  }).lean();

  if (!membership) throw new AppError('Membership not found', 404);

  const tierRule = await LoyaltyRule.findOne({
    shopId,
    loyaltyType: 'tier',
    isActive:    true,
  }).lean();

  const currentTier  = (membership as any).tierLevel ?? 'none';
  const totalPoints  = membership.totalPoints;

  if (!tierRule || !tierRule.config?.tiers?.length) {
    return { currentTier, totalPoints };
  }

  // sort tiers ascending by min_points
  const sortedTiers: Array<{ name: string; min_points: number; reward_value?: string }> =
    [...tierRule.config.tiers].sort((a, b) => a.min_points - b.min_points);

  // find next tier above current points
  const nextTierDef = sortedTiers.find((t) => t.min_points > totalPoints);

  return {
    currentTier,
    totalPoints,
    nextTier:     nextTierDef?.name,
    pointsToNext: nextTierDef ? nextTierDef.min_points - totalPoints : undefined,
  };
};
