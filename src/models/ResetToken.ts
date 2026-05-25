import { Schema, model, Document, Types } from 'mongoose';

export interface IPasswordResetToken extends Document {
  userId:    Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  isUsed:    boolean;
  createdAt: Date;
}

const PasswordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    tokenHash: {
      type:     String,
      required: true,
      unique:   true,
      index:    true,
    },
    expiresAt: {
      type:     Date,
      required: true,
      index:    true,
    },
    isUsed: {
      type:    Boolean,
      default: false,
      index:   true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// auto delete expired tokens from MongoDB
PasswordResetTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

export const PasswordResetToken = model<IPasswordResetToken>(
  'PasswordResetToken',
  PasswordResetTokenSchema
);