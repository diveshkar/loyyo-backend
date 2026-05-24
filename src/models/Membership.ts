import { Schema, model, Document, Types } from 'mongoose';
import { RULE_PROGRESS_STATUSES, TIER_LEVELS, type RuleProgressStatus, type TierLevel } from './enums.js';

export interface IRuleProgress {
  ruleId: Types.ObjectId;
  visitCount: number;
  pointsCount: number;
  spendCount: number;
  version: number;
  status: RuleProgressStatus;
}

export interface IMembership extends Document {
  customerId: Types.ObjectId;
  shopId: Types.ObjectId;
  ruleProgress: IRuleProgress[];
  totalVisits: number;
  totalPoints: number;
  totalSpend: number;
  tierLevel: TierLevel;
  joinedAt: Date;
  lastVisitAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RuleProgressSchema = new Schema<IRuleProgress>(
  {
    ruleId: {
      type: Schema.Types.ObjectId,
      ref: 'LoyaltyRule',
      required: true,
    },
    visitCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    pointsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    spendCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    version: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: RULE_PROGRESS_STATUSES,
      required: true,
      default: 'active',
    },
  },
  { _id: false }
);

const MembershipSchema = new Schema<IMembership>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer ID is required'],
      index: true,
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop ID is required'],
      index: true,
    },
    ruleProgress: {
      type: [RuleProgressSchema],
      default: [],
    },
    totalVisits: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSpend: {
      type: Number,
      default: 0,
      min: 0,
    },
    tierLevel: {
      type: String,
      enum: TIER_LEVELS,
      required: true,
      default: 'none',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    lastVisitAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

MembershipSchema.index({ customerId: 1, shopId: 1 }, { unique: true });

export const Membership = model<IMembership>('Membership', MembershipSchema);
