import { Schema, model, Document, Types } from 'mongoose';

export interface IRuleProgress {
  ruleId:     Types.ObjectId;
  visitCount: number;
  version:    number;
}

export interface IMembership extends Document {
  customerId:   Types.ObjectId;
  shopId:       Types.ObjectId;
  ruleProgress: IRuleProgress[];
  totalVisits:  number;
  joinedAt:     Date;
  lastVisitAt?: Date;
  isActive:     boolean;
  createdAt:    Date;
  updatedAt:    Date;
}

const RuleProgressSchema = new Schema<IRuleProgress>(
  {
    ruleId: {
      type:     Schema.Types.ObjectId,
      ref:      'LoyaltyRule',
      required: true,
    },
    visitCount: {
      type:    Number,
      default: 0,
      min:     0,
    },
    version: {
      type:     Number,
      required: true,
    },
  },
  { _id: false }
);

const MembershipSchema = new Schema<IMembership>(
  {
    customerId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Customer ID is required'],
      index:    true,
    },
    shopId: {
      type:     Schema.Types.ObjectId,
      ref:      'Shop',
      required: [true, 'Shop ID is required'],
      index:    true,
    },
    ruleProgress: {
      type:    [RuleProgressSchema],
      default: [],
    },
    totalVisits: {
      type:    Number,
      default: 0,
      min:     0,
    },
    joinedAt: {
      type:    Date,
      default: Date.now,
    },
    lastVisitAt: {
      type: Date,
    },
    isActive: {
      type:    Boolean,
      default: true,
      index:   true,
    },
  },
  {
    timestamps: true,
  }
);

// One membership per customer per shop
MembershipSchema.index({ customerId: 1, shopId: 1 }, { unique: true });

export const Membership = model<IMembership>('Membership', MembershipSchema);