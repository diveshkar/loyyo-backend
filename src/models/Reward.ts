import { Schema, model, Document, Types } from 'mongoose';

export interface IReward extends Document {
  membershipId:  Types.ObjectId;
  shopId:        Types.ObjectId;
  customerId:    Types.ObjectId;
  ruleVersionId: Types.ObjectId;
  earnedAt:      Date;
  redeemedAt?:   Date;
  status:        'pending' | 'redeemed';
  createdAt:     Date;
  updatedAt:     Date;
}

const RewardSchema = new Schema<IReward>(
  {
    membershipId: {
      type:     Schema.Types.ObjectId,
      ref:      'Membership',
      required: [true, 'Membership ID is required'],
      index:    true,
    },
    shopId: {
      type:     Schema.Types.ObjectId,
      ref:      'Shop',
      required: [true, 'Shop ID is required'],
      index:    true,
    },
    customerId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Customer ID is required'],
      index:    true,
    },
    ruleVersionId: {
      type:     Schema.Types.ObjectId,
      ref:      'LoyaltyRule',
      required: [true, 'Rule version ID is required'],
    },
    earnedAt: {
      type:    Date,
      default: Date.now,
    },
    redeemedAt: {
      type: Date,
    },
    status: {
      type:    String,
      enum:    ['pending', 'redeemed'],
      default: 'pending',
      index:   true,
    },
  },
  {
    timestamps: true,
  }
);

export const Reward = model<IReward>('Reward', RewardSchema);