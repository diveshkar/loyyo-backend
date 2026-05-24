import { Schema, model, Document, Types } from 'mongoose';
import { POINTS_ACTIONS, POINTS_SOURCES, type PointsAction, type PointsSource } from './enums.js';

export interface IPointsLedger extends Document {
  customerId: Types.ObjectId;
  shopId: Types.ObjectId;
  serviceId?: Types.ObjectId;
  visitRef?: Types.ObjectId;
  action: PointsAction;
  source: PointsSource;
  points: number;
  spendAmount?: number;
  balanceAfter: number;
  note?: string;
  createdAt: Date;
}

const PointsLedgerSchema = new Schema<IPointsLedger>(
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
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      index: true,
    },
    visitRef: {
      type: Schema.Types.ObjectId,
      ref: 'Visit',
      index: true,
    },
    action: {
      type: String,
      enum: POINTS_ACTIONS,
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: POINTS_SOURCES,
      required: true,
      index: true,
    },
    points: {
      type: Number,
      required: true,
    },
    spendAmount: {
      type: Number,
      min: 0,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

PointsLedgerSchema.index({ customerId: 1, shopId: 1, createdAt: -1 });

export const PointsLedger = model<IPointsLedger>('PointsLedger', PointsLedgerSchema);
