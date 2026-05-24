import { Schema, model, Document, Types } from 'mongoose';

export interface IService extends Document {
  shopId: Types.ObjectId;
  name: string;
  description?: string;
  isActive: boolean;
  currentRuleVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    currentRuleVersion: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

ServiceSchema.index({ shopId: 1, name: 1 }, { unique: true });

export const Service = model<IService>('Service', ServiceSchema);
