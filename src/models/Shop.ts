import { Schema, model, Document, Types } from 'mongoose';
import {
  SHOP_PLANS, SHOP_STATUSES, SHOP_TYPES, BUSINESS_TYPES,
  type ShopPlan, type ShopStatus, type ShopType, type BusinessType,
} from './enums.js';

export interface IShop extends Document {
  ownerId: Types.ObjectId;
  name: string;
  type: ShopType;
  businessType: BusinessType;
  isAddressPublic: boolean;
  address?: string;
  locationLng?: number;
  locationLat?: number;
  plan: ShopPlan;
  status: ShopStatus;
  apiKey?: string;
  checkinRadius: number;
  planExpiresAt?: Date;
  description?: string;
  category?: string;
  logoUrl?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  createdAt: Date;
  updatedAt: Date;
}

const ShopSchema = new Schema<IShop>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Shop name is required'],
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      enum: SHOP_TYPES,
      required: [true, 'Shop type is required'],
      default: 'other',
      index: true,
    },
    businessType: {
      type: String,
      enum: BUSINESS_TYPES,
      required: [true, 'Business type is required'],
      default: 'physical',
      index: true,
    },
    isAddressPublic: {
      type: Boolean,
      default: true,
    },
    address: {
      type: String,
      trim: true,
    },
    locationLng: {
      type: Number,
      min: -180,
      max: 180,
    },
    locationLat: {
      type: Number,
      min: -90,
      max: 90,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        validate: {
          validator: (coords: number[]) => coords.length === 2,
          message: 'Coordinates must be [longitude, latitude]',
        },
      },
    },
    plan: {
      type: String,
      enum: SHOP_PLANS,
      required: true,
      default: 'free',
    },
    status: {
      type: String,
      enum: SHOP_STATUSES,
      required: true,
      default: 'pending',
      index: true,
    },
    apiKey: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      select: false,
    },
    checkinRadius: {
      type: Number,
      required: true,
      default: 100,
      min: 1,
    },
    planExpiresAt: {
      type: Date,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    logoUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

ShopSchema.pre('validate', function () {
  // home businesses — skip location sync entirely
  if (this.businessType === 'home') return;

  if (this.location?.coordinates?.length === 2) {
    this.locationLng ??= this.location.coordinates[0];
    this.locationLat ??= this.location.coordinates[1];
  } else if (typeof this.locationLng === 'number' && typeof this.locationLat === 'number') {
    this.location = {
      type: 'Point',
      coordinates: [this.locationLng, this.locationLat],
    };
  }

  if (!this.type && this.category) {
    const normalized = this.category.toLowerCase().replace(/\s+/g, '_');
    this.type = SHOP_TYPES.includes(normalized as ShopType) ? (normalized as ShopType) : 'other';
  }
});

ShopSchema.index({ location: '2dsphere' });

export const Shop = model<IShop>('Shop', ShopSchema);