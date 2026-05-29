import { Schema, model, Document, Types } from 'mongoose';
import { USED_BY_DEVICES, type UsedByDevice } from './enums.js';

export type TokenType = 'qr' | 'barcode' | 'order_code';

export interface ICheckinToken extends Document {
  customerId: Types.ObjectId;
  shopId?: Types.ObjectId;
  token: string;
  tokenType: TokenType;
  orderCode?: string;
  qrFormat?: string;
  barcodeFormat?: string;
  expiresAt: Date;
  isUsed: boolean;
  usedAt?: Date;
  usedByDevice?: UsedByDevice;
  createdAt: Date;
}

const CheckinTokenSchema = new Schema<ICheckinToken>(
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
      index: true,
    },
    token: {
      type: String,
      unique: true,
      required: [true, 'Check-in token is required'],
      trim: true,
      index: true,
    },
    tokenType: {
      type: String,
      enum: ['qr', 'barcode', 'order_code'],
      required: [true, 'Token type is required'],
      default: 'qr',
      index: true,
    },
    orderCode: {
      type: String,
      trim: true,
      index: true,
      sparse: true,
    },
    qrFormat: {
      type: String,
    },
    barcodeFormat: {
      type: String,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    isUsed: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    usedAt: {
      type: Date,
    },
    usedByDevice: {
      type: String,
      enum: USED_BY_DEVICES,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

CheckinTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const CheckinToken = model<ICheckinToken>('CheckinToken', CheckinTokenSchema);