import type { IReward } from '../models/Reward.js';
import type { RedeemRewardInput } from './types.js';
import { notImplemented } from './notImplemented.js';

const serviceName = 'reward.service';

export const redeemReward = async (_input: RedeemRewardInput): Promise<IReward> => {
  return notImplemented(serviceName, 'redeemReward');
};
