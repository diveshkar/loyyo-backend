import { Schema, model, Document, Types } from 'mongoose';

export interface IVisit extends Document {
  membershipId: Types.ObjectId;
  shopId: Types.ObjectId;
  customerId: Types.ObjectId;
  markedBy: Types.ObjectId; // User ID of shop owner or authorized terminal
  ruleVersionId: Types.ObjectId; // LoyaltyRule ID active at the moment of stamping
  createdAt: Date;
  updatedAt: Date;
}

const VisitSchema = new Schema<IVisit>(
  {
    membershipId: {
      type: Schema.Types.ObjectId,
      ref: 'Membership',
      required: [true, 'Membership ID is required'],
      index: true,
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop ID is required'],
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer ID is required'],
      index: true,
    },
    markedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'MarkedBy (User ID) is required'],
    },
    ruleVersionId: {
      type: Schema.Types.ObjectId,
      ref: 'LoyaltyRule',
      required: [true, 'Rule version ID is required'],
    },
  },
  {
    timestamps: true, // Auto-manages createdAt (indexed below) and updatedAt
  }
);

// Index on createdAt for fast time-range queries (e.g., visits today, reports)
VisitSchema.index({ createdAt: -1 });

export const Visit = model<IVisit>('Visit', VisitSchema);
