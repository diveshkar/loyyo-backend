import { Schema, model, Document, Types } from 'mongoose';
import { REFERRAL_STATUSES, type ReferralStatus } from './enums.js';

export interface IReferral extends Document {
  referrerId: Types.ObjectId;
  refereeId?: Types.ObjectId;
  shopId: Types.ObjectId;
  referralCode: string;
  status: ReferralStatus;
  referrerPoints: number;
  refereePoints: number;
  completedAt?: Date;
  rewardedAt?: Date;
  createdAt: Date;
}

const ReferralSchema = new Schema<IReferral>(
  {
    referrerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Referrer ID is required'],
      index: true,
    },
    refereeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop ID is required'],
      index: true,
    },
    referralCode: {
      type: String,
      unique: true,
      required: [true, 'Referral code is required'],
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: REFERRAL_STATUSES,
      required: true,
      default: 'pending',
      index: true,
    },
    referrerPoints: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
    },
    refereePoints: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
    },
    completedAt: {
      type: Date,
    },
    rewardedAt: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

ReferralSchema.index({ referrerId: 1, shopId: 1, createdAt: -1 });

export const Referral = model<IReferral>('Referral', ReferralSchema);
