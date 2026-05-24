import { Schema, model, Document, Types } from 'mongoose';
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES, type AuditAction, type AuditTargetType } from './enums.js';

export interface IAuditLog extends Document {
  adminId: Types.ObjectId;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: Types.ObjectId;
  before?: Record<string, any>;
  after?: Record<string, any>;
  reason: string;
  ip?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin ID is required'],
      index: true,
    },
    action: {
      type: String,
      enum: AUDIT_ACTIONS,
      required: [true, 'Audit action is required'],
      index: true,
    },
    targetType: {
      type: String,
      enum: AUDIT_TARGET_TYPES,
      required: [true, 'Target type is required'],
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Target ID is required'],
      index: true,
    },
    before: {
      type: Schema.Types.Mixed,
    },
    after: {
      type: Schema.Types.Mixed,
    },
    reason: {
      type: String,
      required: [true, 'Audit reason is required'],
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

const blockWrite = function (next: any) {
  next(new Error('Audit logs are immutable. Update and delete operations are strictly prohibited.'));
};

AuditLogSchema.pre('updateOne', blockWrite);
AuditLogSchema.pre('findOneAndUpdate', blockWrite);
AuditLogSchema.pre('updateMany', blockWrite);
AuditLogSchema.pre('deleteOne', blockWrite);
AuditLogSchema.pre('deleteMany', blockWrite);
AuditLogSchema.pre('findOneAndDelete', blockWrite);

AuditLogSchema.pre('save', function (this: any, next: any) {
  if (!this.isNew) {
    return next(new Error('Audit logs are immutable. Re-saving existing logs is prohibited.'));
  }
  next();
});

export const AuditLog = model<IAuditLog>('AuditLog', AuditLogSchema);
