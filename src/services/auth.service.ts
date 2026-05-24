import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { Types } from 'mongoose';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { Shop } from '../models/Shop.js';
import { User, type IUser } from '../models/User.js';
import * as emailService from './email.service.js';
import type {
  AuthResult,
  AuthTokens,
  LoginInput,
  LogoutInput,
  RefreshTokenInput,
  RegisterCustomerInput,
  RegisterShopInput,
} from './types.js';

interface RefreshJwtPayload {
  id: string;
  role: 'customer' | 'shop' | 'admin';
  tokenType: 'refresh';
}

const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const parseDurationMs = (duration: string): number => {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) {
    return 30 * 24 * 60 * 60 * 1000;
  }

  const value = Number(match[1]);
  const unit = match[2];
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
    'tea_shop',
    'salon',
    'restaurant',
    'supermarket',
    'clothing',
    'electronics',
    'gym',
    'pharmacy',
    'grocery',
    'bakery',
    'other',
  ];

  return allowedTypes.includes(normalized as NonNullable<RegisterShopInput['type']>)
    ? (normalized as NonNullable<RegisterShopInput['type']>)
    : 'other';
};

const createAccessToken = (user: IUser): string => {
  const payload = {
    id: String(user._id),
    role: user.role,
  };

  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  } as SignOptions);
};

const createRefreshToken = (user: IUser): string => {
  const payload: RefreshJwtPayload = {
    id: String(user._id),
    role: user.role,
    tokenType: 'refresh',
  };

  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  } as SignOptions);
};

const issueTokens = async (user: IUser): Promise<AuthTokens> => {
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);
  const tokenHash = hashToken(refreshToken);

  await RefreshToken.create({
    userId: user._id,
    tokenHash,
    expiresAt: new Date(Date.now() + parseDurationMs(env.jwt.refreshExpiresIn)),
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: env.jwt.expiresIn,
  };
};

const getPublicUser = async (userId: Types.ObjectId | string): Promise<IUser> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

const createAuthResult = async (user: IUser): Promise<AuthResult> => {
  const publicUser = await getPublicUser(String(user._id));
  const tokens = await issueTokens(publicUser);

  return {
    user: publicUser,
    tokens,
  };
};

export const registerCustomer = async (input: RegisterCustomerInput): Promise<AuthResult> => {
  const existingUser = await User.findOne({ email: input.email });
  if (existingUser) {
    throw new AppError('An account with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    phone: input.phone,
    role: 'customer',
  });

  return createAuthResult(user);
};

export const loginCustomer = async (input: LoginInput): Promise<AuthResult> => {
  const user = await User.findOne({ email: input.email, role: 'customer' }).select('+passwordHash');
  if (!user || !(await user.comparePassword(input.password))) {
    throw new AppError('Invalid email or password', 401);
  }

  return createAuthResult(user);
};

export const registerShop = async (input: RegisterShopInput): Promise<AuthResult> => {
  const existingUser = await User.findOne({ email: input.ownerEmail });
  if (existingUser) {
    throw new AppError('An account with this owner email already exists', 409);
  }

  const existingShop = await Shop.findOne({ name: input.shopName });
  if (existingShop) {
    throw new AppError('A shop with this name already exists', 409);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const owner = await User.create({
    name: input.ownerName,
    email: input.ownerEmail,
    passwordHash,
    phone: input.phone,
    role: 'shop',
  });

  await Shop.create({
    ownerId: owner._id,
    name: input.shopName,
    description: input.description,
    category: input.category,
    type: input.type ?? normalizeShopType(input.category),
    logoUrl: input.logoUrl,
    address: input.address,
    locationLng: input.longitude,
    locationLat: input.latitude,
    location: {
      type: 'Point',
      coordinates: [input.longitude, input.latitude],
    },
    status: 'pending',
    plan: 'free',
  });

  emailService
    .sendWelcomeEmail(owner.email, owner.name)
    .catch((error) => console.error('Failed to send shop welcome email:', error));

  return createAuthResult(owner);
};

export const loginShop = async (input: LoginInput): Promise<AuthResult> => {
  const user = await User.findOne({ email: input.email, role: 'shop' }).select('+passwordHash');
  if (!user || !(await user.comparePassword(input.password))) {
    throw new AppError('Invalid email or password', 401);
  }

  const shop = await Shop.findOne({ ownerId: user._id });
  if (!shop) {
    throw new AppError('Shop profile not found for this account', 404);
  }

  if (shop.status !== 'active') {
    throw new AppError(`Shop account is ${shop.status}. Admin approval is required before login.`, 403);
  }

  return createAuthResult(user);
};

export const refreshToken = async (input: RefreshTokenInput): Promise<AuthTokens> => {
  let decoded: RefreshJwtPayload;
  try {
    decoded = jwt.verify(input.refreshToken, env.jwt.refreshSecret) as RefreshJwtPayload;
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  if (decoded.tokenType !== 'refresh') {
    throw new AppError('Invalid refresh token type', 401);
  }

  const currentTokenHash = hashToken(input.refreshToken);
  const storedToken = await RefreshToken.findOne({
    tokenHash: currentTokenHash,
    revokedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  });

  if (!storedToken) {
    throw new AppError('Refresh token has been revoked or expired', 401);
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError('User no longer exists', 401);
  }

  const tokens = await issueTokens(user);
  storedToken.revokedAt = new Date();
  storedToken.replacedByTokenHash = hashToken(tokens.refreshToken);
  await storedToken.save();

  return tokens;
};

export const logout = async (input: LogoutInput): Promise<void> => {
  if (input.refreshToken) {
    await RefreshToken.updateOne(
      {
        userId: input.userId,
        tokenHash: hashToken(input.refreshToken),
        revokedAt: { $exists: false },
      },
      { $set: { revokedAt: new Date() } }
    );
    return;
  }

  await RefreshToken.updateMany(
    {
      userId: input.userId,
      revokedAt: { $exists: false },
    },
    { $set: { revokedAt: new Date() } }
  );
};
