import { Schema, model, Document, Types } from 'mongoose';

export interface IPayment extends Document {
  shopId: Types.ObjectId;
  plan: 'basic' | 'standard' | 'premium';
  amount: number; // In LKR
  currency: string; // 'LKR'
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  payhereReference?: string; // Transaction reference from PayHere
  payherePaymentId?: string; // Payment ID from PayHere
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop ID is required'],
      index: true,
    },
    plan: {
      type: String,
      enum: ['basic', 'standard', 'premium'],
      required: [true, 'Subscription plan is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'LKR',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    payhereReference: {
      type: String,
      trim: true,
      index: true,
    },
    payherePaymentId: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Payment = model<IPayment>('Payment', PaymentSchema);
