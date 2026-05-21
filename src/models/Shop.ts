import { Schema, model, Document, Types } from 'mongoose';

export interface IShop extends Document {
  ownerId: Types.ObjectId;
  name: string;
  description: string;
  category: string;
  logoUrl?: string;
  address: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  status: 'pending' | 'active' | 'suspended';
  plan: 'free' | 'basic' | 'standard' | 'premium';
  planExpiresAt?: Date;
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
    description: {
      type: String,
      required: [true, 'Shop description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true, // e.g. 'Cafe', 'Salon', 'Gym'
    },
    logoUrl: {
      type: String,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true,
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
        validate: {
          validator: (coords: number[]) => coords.length === 2,
          message: 'Coordinates must be [longitude, latitude]',
        },
      },
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended'],
      default: 'pending',
      index: true,
    },
    plan: {
      type: String,
      enum: ['free', 'basic', 'standard', 'premium'],
      default: 'free',
    },
    planExpiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Geo-spatial index for nearby shop lookup
ShopSchema.index({ location: '2dsphere' });

export const Shop = model<IShop>('Shop', ShopSchema);
