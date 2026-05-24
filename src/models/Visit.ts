import { Schema, model, Document, Types } from 'mongoose';
import { MARKED_BY_METHODS, type MarkedByMethod } from './enums.js';

export interface IProductBought {
  productId?: string;
  productName: string;
  quantity: number;
  points?: number;
}

export interface IVisit extends Document {
  customerId: Types.ObjectId;
  shopId: Types.ObjectId;
  membershipId: Types.ObjectId;
  markedByMethod: MarkedByMethod;
  checkinToken?: string;
  locationVerified: boolean;
  spendAmount?: number;
  pointsEarned?: number;
  productsBought?: IProductBought[];
  createdAt: Date;
  updatedAt: Date;
  markedBy?: Types.ObjectId;
  ruleVersionId?: Types.ObjectId;
}

const VisitSchema = new Schema<IVisit>(
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
    membershipId: {
      type: Schema.Types.ObjectId,
      ref: 'Membership',
      required: [true, 'Membership ID is required'],
      index: true,
    },
    markedByMethod: {
      type: String,
      enum: MARKED_BY_METHODS,
      required: true,
      default: 'manual',
      index: true,
    },
    checkinToken: {
      type: String,
      trim: true,
    },
    locationVerified: {
      type: Boolean,
      required: true,
      default: false,
    },
    spendAmount: {
      type: Number,
      min: 0,
    },
    pointsEarned: {
      type: Number,
      min: 0,
    },
    productsBought: {
      type: [
        {
          productId: String,
          productName: { type: String, required: true },
          quantity: { type: Number, required: true, min: 1 },
          points: { type: Number, min: 0 },
          _id: false,
        },
      ],
    },
    markedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    ruleVersionId: {
      type: Schema.Types.ObjectId,
      ref: 'LoyaltyRule',
    },
  },
  {
    timestamps: true,
  }
);

VisitSchema.index({ createdAt: -1 });
VisitSchema.index({ customerId: 1, shopId: 1, createdAt: 1 });

export const Visit = model<IVisit>('Visit', VisitSchema);
