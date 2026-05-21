import { Schema, model, Document, Types } from 'mongoose';

export interface ILoyaltyRule extends Document {
  shopId: Types.ObjectId;
  title: string;
  visitsRequired: number;
  rewardDescription: string;
  version: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LoyaltyRuleSchema = new Schema<ILoyaltyRule>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Loyalty service title is required'],
      trim: true,
    },
    visitsRequired: {
      type: Number,
      required: [true, 'Number of visits required is required'],
      min: [1, 'Must require at least 1 visit'],
    },
    rewardDescription: {
      type: String,
      required: [true, 'Reward description is required'],
      trim: true,
    },
    version: {
      type: Number,
      required: true,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index on shopId and version to track historical configurations
LoyaltyRuleSchema.index({ shopId: 1, version: 1 }, { unique: true });

export const LoyaltyRule = model<ILoyaltyRule>('LoyaltyRule', LoyaltyRuleSchema);
