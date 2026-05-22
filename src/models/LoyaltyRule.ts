import { Schema, model, Document, Types } from 'mongoose';

export interface ILoyaltyRule extends Document {
  shopId:            Types.ObjectId;
  title:             string;
  visitsRequired:    number;
  rewardDescription: string;
  version:           number;
  isActive:          boolean;  // per-rule active — not "only one can be active"
  createdAt:         Date;
  updatedAt:         Date;
}

const LoyaltyRuleSchema = new Schema<ILoyaltyRule>(
  {
    shopId: {
      type:     Schema.Types.ObjectId,
      ref:      'Shop',
      required: [true, 'Shop ID is required'],
      index:    true,
    },
    title: {
      type:     String,
      required: [true, 'Loyalty rule title is required'],
      trim:     true,
    },
    visitsRequired: {
      type:     Number,
      required: [true, 'Visits required is required'],
      min:      [1, 'Must require at least 1 visit'],
    },
    rewardDescription: {
      type:     String,
      required: [true, 'Reward description is required'],
      trim:     true,
    },
    version: {
      type:     Number,
      required: true,
      default:  1,
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

// No duplicate versions per rule title per shop
LoyaltyRuleSchema.index({ shopId: 1, version: 1 }, { unique: true });

// Fast lookup of all active rules for a shop
LoyaltyRuleSchema.index({ shopId: 1, isActive: 1 });

export const LoyaltyRule = model<ILoyaltyRule>('LoyaltyRule', LoyaltyRuleSchema);