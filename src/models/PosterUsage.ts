import { Schema, model, Document, Types } from 'mongoose';

export interface IPosterUsage extends Document {
  shopId:    Types.ObjectId;
  yearMonth: string;          // e.g. "2026-05"
  count:     number;
  updatedAt: Date;
}

const PosterUsageSchema = new Schema<IPosterUsage>(
  {
    shopId: {
      type:     Schema.Types.ObjectId,
      ref:      'Shop',
      required: true,
      index:    true,
    },
    yearMonth: {
      type:     String,
      required: true,
      index:    true,
    },
    count: {
      type:    Number,
      default: 0,
      min:     0,
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
  }
);

// unique per shop per month
PosterUsageSchema.index({ shopId: 1, yearMonth: 1 }, { unique: true });

export const PosterUsage = model<IPosterUsage>('PosterUsage', PosterUsageSchema);
