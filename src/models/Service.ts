import { Schema, model, Document, Types } from 'mongoose';

export interface IAddon {
  name:       string;
  price:      number;
  isVisible:  boolean;
}

export interface IServiceProduct {
  productId:  string;
  name:       string;
  price:      number;
  points:     number;    // points this product gives — product-based loyalty
  isVisible:  boolean;
}

export interface IService extends Document {
  shopId:             Types.ObjectId;
  name:               string;
  description?:       string;
  addons:             IAddon[];
  products:           IServiceProduct[];
  isActive:           boolean;
  currentRuleVersion: number;
  createdAt:          Date;
  updatedAt:          Date;
}

const AddonSchema = new Schema<IAddon>(
  {
    name: {
      type:     String,
      required: true,
      trim:     true,
    },
    price: {
      type:     Number,
      required: true,
      min:      0,
    },
    isVisible: {
      type:    Boolean,
      default: true,
    },
  },
  { _id: false }
);

const ServiceProductSchema = new Schema<IServiceProduct>(
  {
    productId: {
      type:     String,
      required: true,
    },
    name: {
      type:     String,
      required: true,
      trim:     true,
    },
    price: {
      type:     Number,
      required: true,
      min:      0,
    },
    points: {
      type:     Number,
      required: true,
      min:      0,
      default:  0,
    },
    isVisible: {
      type:    Boolean,
      default: true,
    },
  },
  { _id: false }
);

const ServiceSchema = new Schema<IService>(
  {
    shopId: {
      type:     Schema.Types.ObjectId,
      ref:      'Shop',
      required: [true, 'Shop ID is required'],
      index:    true,
    },
    name: {
      type:     String,
      required: [true, 'Service name is required'],
      trim:     true,
    },
    description: {
      type: String,
      trim: true,
    },
    addons: {
      type:    [AddonSchema],
      default: [],
    },
    products: {
      type:    [ServiceProductSchema],
      default: [],
    },
    isActive: {
      type:     Boolean,
      required: true,
      default:  true,
      index:    true,
    },
    currentRuleVersion: {
      type:     Number,
      required: true,
      default:  1,
      min:      1,
    },
  },
  {
    timestamps: true,
  }
);

ServiceSchema.index({ shopId: 1, name: 1 }, { unique: true });
ServiceSchema.index({ shopId: 1, isActive: 1 });

export const Service = model<IService>('Service', ServiceSchema);