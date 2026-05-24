import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { USER_ROLES, type UserRole } from './enums.js';

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  profilePhoto?: string;
  isActive: boolean;
  avatarUrl?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
      default: 'customer',
    },
    profilePhoto: {
      type: String,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    avatarUrl: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.pre('validate', function () {
  if (this.avatarUrl && !this.profilePhoto) {
    this.profilePhoto = this.avatarUrl;
  }

  if (this.profilePhoto && !this.avatarUrl) {
    this.avatarUrl = this.profilePhoto;
  }

});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = model<IUser>('User', UserSchema);
