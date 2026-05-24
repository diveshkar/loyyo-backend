import { Schema, model, Document, Types } from 'mongoose';
import { DISCOUNT_TYPES, type DiscountType } from './enums.js';

export interface IOffer extends Document {
  shopId: Types.ObjectId;
  title: string;
  description: string;
  imageUrl?: string;
  discountType: DiscountType;
  discountValue: string;
  startDate: Date;
  endDate: Date;
  emailSent: boolean;
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OfferSchema = new Schema<IOffer>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Offer title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Offer description is required'],
      trim: true,
    },
    imageUrl: {
      type: String,
    },
    discountType: {
      type: String,
      enum: DISCOUNT_TYPES,
      required: true,
      default: 'fixed',
    },
    discountValue: {
      type: String,
      required: true,
      default: '0',
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    emailSent: {
      type: Boolean,
      required: true,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

OfferSchema.pre('validate', function () {
  if (this.expiresAt && !this.endDate) {
    this.endDate = this.expiresAt;
  }

  if (!this.expiresAt && this.endDate) {
    this.expiresAt = this.endDate;
  }

});

export const Offer = model<IOffer>('Offer', OfferSchema);
