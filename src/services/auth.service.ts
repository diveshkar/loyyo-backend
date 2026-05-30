import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { Types } from 'mongoose';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { PasswordResetToken } from '../models/ResetToken.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { Shop } from '../models/Shop.js';
import { User, type IUser } from '../models/User.js';
import * as emailService from './email.service.js';
import type {
  AuthResult,
  AuthTokens,
  ChangePasswordInput,
  EntityId,
  ForgotPasswordInput,
  LoginInput,
  LogoutInput,
  RefreshTokenInput,
  RegisterCustomerInput,
  RegisterShopInput,
  ResetPasswordInput,
} from './types.js';

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

interface RefreshJwtPayload {
  id:        string;
  role:      'customer' | 'shop' | 'admin';
  tokenType: 'refresh';
}

const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

const parseDurationMs = (duration: string): number => {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) return 30 * 24 * 60 * 60 * 1000;

  const value = Number(match[1]);
  const unit  = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * multipliers[unit]!;
};

const normalizeShopType = (category?: string): RegisterShopInput['type'] => {
  const normalized = category?.toLowerCase().replace(/\s+/g, '_');
  const allowedTypes: Array<NonNullable<RegisterShopInput['type']>> = [
    'tea_shop', 'salon', 'restaurant', 'supermarket',
    'clothing', 'electronics', 'gym', 'pharmacy',
    'grocery', 'bakery', 'other',
  ];

  return allowedTypes.includes(normalized as NonNullable<RegisterShopInput['type']>)
    ? (normalized as NonNullable<RegisterShopInput['type']>)
    : 'other';
};

const createAccessToken = (user: IUser): string =>
  jwt.sign(
    { id: String(user._id), role: user.role },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn } as SignOptions
  );

const createRefreshToken = (user: IUser): string =>
  jwt.sign(
    { id: String(user._id), role: user.role, tokenType: 'refresh' } as RefreshJwtPayload,
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiresIn } as SignOptions
  );

const issueTokens = async (user: IUser): Promise<AuthTokens> => {
  const accessToken  = createAccessToken(user);
  const refreshToken = createRefreshToken(user);
  const tokenHash    = hashToken(refreshToken);

  await RefreshToken.create({
    userId:    user._id,
    tokenHash,
    expiresAt: new Date(Date.now() + parseDurationMs(env.jwt.refreshExpiresIn)),
  });

  return { accessToken, refreshToken, expiresIn: env.jwt.expiresIn };
};

const createAuthResult = async (user: IUser): Promise<AuthResult> => {
  const publicUser = await User.findById(user._id);
  if (!publicUser) throw new AppError('User not found', 404);

  const tokens = await issueTokens(publicUser);
  return { user: publicUser, tokens };
};

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER / LOGIN
// ─────────────────────────────────────────────────────────────────────────────

export const registerCustomer = async (
  input: RegisterCustomerInput
): Promise<AuthResult> => {
  const existingUser = await User.findOne({ email: input.email });
  if (existingUser)
    throw new AppError('An account with this email already exists', 409);

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await User.create({
    name:  input.name,
    email: input.email,
    passwordHash,
    phone: input.phone,
    role:  'customer',
  });

  return createAuthResult(user);
};

export const loginCustomer = async (
  input: LoginInput
): Promise<AuthResult> => {
  const user = await User.findOne({
    email: input.email,
    role:  'customer',
  }).select('+passwordHash');

  if (!user || !(await user.comparePassword(input.password)))
    throw new AppError('Invalid email or password', 401);

  return createAuthResult(user);
};

export const registerShop = async (
  input: RegisterShopInput
): Promise<AuthResult> => {
  const existingUser = await User.findOne({ email: input.ownerEmail });
  if (existingUser)
    throw new AppError('An account with this owner email already exists', 409);

  const existingShop = await Shop.findOne({ name: input.shopName });
  if (existingShop)
    throw new AppError('A shop with this name already exists', 409);

  // physical shops require location
  if (input.businessType === 'physical') {
    if (!input.address || input.longitude === undefined || input.latitude === undefined) {
      throw new AppError('Physical shops require address and location coordinates', 400);
    }
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const owner = await User.create({
    name:  input.ownerName,
    email: input.ownerEmail,
    passwordHash,
    phone: input.phone,
    role:  'shop',
  });

  const shopData: Record<string, unknown> = {
    ownerId:      owner._id,
    name:         input.shopName,
    description:  input.description,
    category:     input.category,
    type:         input.type ?? normalizeShopType(input.category),
    logoUrl:      input.logoUrl,
    businessType: input.businessType,
    status:       'pending',
    plan:         input.businessType === 'home' ? 'micro' : 'free',
  };

  if (input.businessType === 'physical') {
    shopData.address     = input.address;
    shopData.locationLng = input.longitude;
    shopData.locationLat = input.latitude;
    shopData.location    = {
      type:        'Point',
      coordinates: [input.longitude, input.latitude],
    };
  }

  if (input.businessType === 'home') {
    shopData.isAddressPublic = input.isAddressPublic ?? false;
    if (input.address) shopData.address = input.address;
  }

  await Shop.create(shopData);

  emailService
    .sendWelcomeEmail(owner.email, owner.name)
    .catch((err) => console.error('Failed to send shop welcome email:', err));

  return createAuthResult(owner);
};

export const loginShop = async (
  input: LoginInput
): Promise<AuthResult> => {
  const user = await User.findOne({
    email: input.email,
    role:  'shop',
  }).select('+passwordHash');

  if (!user || !(await user.comparePassword(input.password)))
    throw new AppError('Invalid email or password', 401);

  const shop = await Shop.findOne({ ownerId: user._id });
  if (!shop)
    throw new AppError('Shop profile not found for this account', 404);

  if (shop.status !== 'active')
    throw new AppError(
      `Shop account is ${shop.status}. Admin approval is required before login.`,
      403
    );

  return createAuthResult(user);
};

export const loginAdmin = async (
  input: LoginInput
): Promise<AuthResult> => {
  const user = await User.findOne({
    email: input.email,
    role:  'admin',
  }).select('+passwordHash');

  if (!user || !(await user.comparePassword(input.password)))
    throw new AppError('Invalid email or password', 401);

  if (!user.isActive)
    throw new AppError('This admin account has been deactivated', 403);

  return createAuthResult(user);
};

// ─────────────────────────────────────────────────────────────────────────────
// TOKEN MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export const refreshToken = async (
  input: RefreshTokenInput
): Promise<AuthTokens> => {
  let decoded: RefreshJwtPayload;
  try {
    decoded = jwt.verify(
      input.refreshToken,
      env.jwt.refreshSecret
    ) as RefreshJwtPayload;
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  if (decoded.tokenType !== 'refresh')
    throw new AppError('Invalid refresh token type', 401);

  const currentTokenHash = hashToken(input.refreshToken);
  const storedToken = await RefreshToken.findOne({
    tokenHash: currentTokenHash,
    revokedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  });

  if (!storedToken)
    throw new AppError('Refresh token has been revoked or expired', 401);

  const user = await User.findById(decoded.id);
  if (!user) throw new AppError('User no longer exists', 401);

  const tokens = await issueTokens(user);
  storedToken.revokedAt            = new Date();
  storedToken.replacedByTokenHash  = hashToken(tokens.refreshToken);
  await storedToken.save();

  return tokens;
};

export const logout = async (input: LogoutInput): Promise<void> => {
  if (input.refreshToken) {
    await RefreshToken.updateOne(
      {
        userId:    input.userId,
        tokenHash: hashToken(input.refreshToken),
        revokedAt: { $exists: false },
      },
      { $set: { revokedAt: new Date() } }
    );
    return;
  }

  await RefreshToken.updateMany(
    { userId: input.userId, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } }
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PASSWORD MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export const forgotPassword = async (
  input: ForgotPasswordInput
): Promise<void> => {
  const user = await User.findOne({ email: input.email.toLowerCase().trim() });

  // always return success — never reveal if email exists or not
  if (!user) return;

  // invalidate any existing reset tokens for this user
  await PasswordResetToken.updateMany(
    { userId: user._id, isUsed: false },
    { $set: { isUsed: true } }
  );

  // generate new reset token
  const rawToken   = crypto.randomBytes(32).toString('hex');
  const tokenHash  = hashToken(rawToken);

  await PasswordResetToken.create({
    userId:    user._id,
    tokenHash,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    isUsed:    false,
  });

  // send reset email
  emailService
    .sendPasswordResetEmail(user.email, user.name, rawToken)
    .catch((err) => console.error('Failed to send reset email:', err));
};

export const resetPassword = async (
  input: ResetPasswordInput
): Promise<void> => {
  const tokenHash   = hashToken(input.token);
  const resetToken  = await PasswordResetToken.findOne({
    tokenHash,
    isUsed:    false,
    expiresAt: { $gt: new Date() },
  });

  if (!resetToken)
    throw new AppError('Invalid or expired reset token', 401);

  const user = await User.findById(resetToken.userId).select('+passwordHash');
  if (!user) throw new AppError('User not found', 404);

  // update password
  user.passwordHash = await bcrypt.hash(input.newPassword, 12);
  await user.save();

  // mark token as used
  resetToken.isUsed = true;
  await resetToken.save();

  // revoke all refresh tokens — force re-login everywhere
  await RefreshToken.updateMany(
    { userId: user._id, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } }
  );
};

export const changePassword = async (
  input: ChangePasswordInput
): Promise<void> => {
  const user = await User.findById(input.userId).select('+passwordHash');
  if (!user) throw new AppError('User not found', 404);

  const isMatch = await user.comparePassword(input.oldPassword);
  if (!isMatch)
    throw new AppError('Current password is incorrect', 401);

  if (input.oldPassword === input.newPassword)
    throw new AppError('New password must be different from current password', 400);

  user.passwordHash = await bcrypt.hash(input.newPassword, 12);
  await user.save();

  // revoke all refresh tokens — force re-login everywhere
  await RefreshToken.updateMany(
    { userId: user._id, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } }
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────────────────────

export const getMe = async (userId: EntityId): Promise<IUser> => {
  const user = await User.findById(userId.toString());
  if (!user) throw new AppError('User not found', 404);
  return user;
};

export const updateMe = async (
  userId: EntityId,
  updates: { name?: string; phone?: string }
): Promise<IUser> => {
  const user = await User.findByIdAndUpdate(
    userId.toString(),
    { $set: updates },
    { new: true, runValidators: true }
  );
  if (!user) throw new AppError('User not found', 404);
  return user;
};
