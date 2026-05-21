import { Schema, model, Document, Types } from 'mongoose';

export interface IMembership extends Document {
  customerId: Types.ObjectId;
  shopId: Types.ObjectId;
  visitCount: number;
  totalVisits: number;
  activeRuleId?: Types.ObjectId; // ref: LoyaltyRule / LoyaltyService
  joinedAt: Date;
  lastVisitAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

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
    visitCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalVisits: {
      type: Number,
      default: 0,
      min: 0,
    },
    activeRuleId: {
      type: Schema.Types.ObjectId,
      ref: 'LoyaltyRule', // Reference to the rule governing the current stamp cycle
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    lastVisitAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: A customer can only have one membership card per shop
MembershipSchema.index({ customerId: 1, shopId: 1 }, { unique: true });

export const Membership = model<IMembership>('Membership', MembershipSchema);
