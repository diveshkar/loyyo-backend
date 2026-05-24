import type { INotification } from '../models/Notification.js';
import type { RedeemRewardInput } from './types.js';
import { redeemReward as redeemLoyaltyReward } from './loyalty.service.js';

export const redeemReward = async (input: RedeemRewardInput): Promise<INotification> => {
  return redeemLoyaltyReward(input);
};
