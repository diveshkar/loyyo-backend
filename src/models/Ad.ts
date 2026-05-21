import { Schema, model, Document, Types } from 'mongoose';

export interface IExternalContact {
  contactName:  string;
  contactPhone: string;
  contactEmail: string;
  shopName:     string;
}

export interface IAd extends Document {
  shopId:           Types.ObjectId;
  title:            string;
  description:      string;
  imageUrl?:        string;
  adType:           'internal' | 'boost' | 'external';
  weeklyBudget:     number;
  isActive:         boolean;
  startDate:        Date;
  endDate:          Date;
  impressions:      number;
  clicks:           number;
  externalContact?: IExternalContact;
  createdAt:        Date;
  updatedAt:        Date;
}

const AdSchema = new Schema<IAd>(
  {
    shopId: {
      type:     Schema.Types.ObjectId,
      ref:      'Shop',
      required: [true, 'Shop ID is required'],
      index:    true,
    },
    title: {
      type:     String,
      required: [true, 'Ad title is required'],
      trim:     true,
    },
    description: {
      type:     String,
      required: [true, 'Ad description is required'],
      trim:     true,
    },
    imageUrl: {
      type: String,
    },
    adType: {
      type:     String,
      enum:     ['internal', 'boost', 'external'],
      required: [true, 'Ad type is required'],
      index:    true,
    },
    weeklyBudget: {
      type:     Number,
      required: [true, 'Weekly budget is required'],
      min:      [0, 'Weekly budget cannot be negative'],
    },
    isActive: {
      type:    Boolean,
      default: true,
      index:   true,
    },
    startDate: {
      type:    Date,
      required: true,
      default:  Date.now,
    },
    endDate: {
      type:     Date,
      required: true,
    },
    impressions: {
      type:    Number,
      default: 0,
    },
    clicks: {
      type:    Number,
      default: 0,
    },
    externalContact: {
      type: {
        contactName:  { type: String, required: true },
        contactPhone: { type: String, required: true },
        contactEmail: { type: String, required: true },
        shopName:     { type: String, required: true },
      },
      required: false,
      _id:      false,
    },
  },
  {
    timestamps: true,
  }
);

// For ad feed query
AdSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

// For shop dashboard
AdSchema.index({ shopId: 1, createdAt: -1 });

export const Ad = model<IAd>('Ad', AdSchema);