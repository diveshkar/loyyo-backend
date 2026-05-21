import type { ILoyaltyRule } from '../models/LoyaltyRule.js';
import type { IMembership } from '../models/Membership.js';
import type { IReward } from '../models/Reward.js';
import type { IVisit } from '../models/Visit.js';
import { notImplemented } from './notImplemented.js';
import type {
  CreateOrUpdateLoyaltyRuleInput,
  MarkPosVisitInput,
  MarkVisitInput,
  PaginatedResult,
  VisitHistoryInput,
} from './types.js';

const serviceName = 'loyalty.service';

export const createOrUpdateRuleForOwner = async (
  _input: CreateOrUpdateLoyaltyRuleInput
): Promise<ILoyaltyRule> => {
  return notImplemented(serviceName, 'createOrUpdateRuleForOwner');
};

export const recordVisitForOwner = async (
  _input: MarkVisitInput
): Promise<{ membership: IMembership; rewardEarned: boolean; reward?: IReward }> => {
  return notImplemented(serviceName, 'recordVisitForOwner');
};

export const recordPosVisit = async (
  _input: MarkPosVisitInput
): Promise<{ membership: IMembership; rewardEarned: boolean; reward?: IReward }> => {
  return notImplemented(serviceName, 'recordPosVisit');
};

export const getVisitHistory = async (
  _input: VisitHistoryInput
): Promise<PaginatedResult<IVisit>> => {
  return notImplemented(serviceName, 'getVisitHistory');
};
