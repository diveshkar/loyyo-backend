import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  adminId:    Types.ObjectId;
  action:
    | 'SHOP_APPROVED'
    | 'SHOP_SUSPENDED'
    | 'SHOP_REINSTATED'
    | 'USER_DEACTIVATED'
    | 'AD_PAUSED'
    | 'AD_REMOVED'
    | 'AD_REMOVED_BY_ADMIN'
    | 'PAYMENT_REFUNDED';
  targetType: 'shop' | 'user' | 'ad' | 'payment';
  targetId:   Types.ObjectId;
  before?:    Record<string, any>;
  after?:     Record<string, any>;
  reason?:    string;
  ip?:        string;
  createdAt:  Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    adminId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Admin ID is required'],
      index:    true,
    },
    action: {
      type: String,
      enum: [
        'SHOP_APPROVED',
        'SHOP_SUSPENDED',
        'SHOP_REINSTATED',
        'USER_DEACTIVATED',
        'AD_PAUSED',
        'AD_REMOVED',
        'AD_REMOVED_BY_ADMIN',
        'PAYMENT_REFUNDED',
      ],
      required: [true, 'Audit action is required'],
      index:    true,
    },
    targetType: {
      type:     String,
      enum:     ['shop', 'user', 'ad', 'payment'],
      required: [true, 'Target type is required'],
    },
    targetId: {
      type:     Schema.Types.ObjectId,
      required: [true, 'Target ID is required'],
      index:    true,
    },
    before: {
      type: Schema.Types.Mixed,
    },
    after: {
      type: Schema.Types.Mixed,
    },
    reason: {
      type: String,
      trim: true,
    },
    ip: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// ─── IMMUTABILITY GUARDS ──────────────────────────────────────────────────────

const blockWrite = function (next: any) {
  next(new Error('Audit logs are immutable. Update and delete operations are strictly prohibited.'));
};

AuditLogSchema.pre('updateOne',        blockWrite);
AuditLogSchema.pre('findOneAndUpdate', blockWrite);
AuditLogSchema.pre('updateMany',       blockWrite);
AuditLogSchema.pre('deleteOne',        blockWrite);
AuditLogSchema.pre('deleteMany',       blockWrite);
AuditLogSchema.pre('findOneAndDelete', blockWrite);

AuditLogSchema.pre('save', function (this: any, next: any) {
  if (!this.isNew) {
    return next(new Error('Audit logs are immutable. Re-saving existing logs is prohibited.'));
  }
  next();
});

export const AuditLog = model<IAuditLog>('AuditLog', AuditLogSchema);