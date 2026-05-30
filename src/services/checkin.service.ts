import crypto from 'crypto';
import { Types } from 'mongoose';
import { AppError } from '../middleware/errorHandler.js';
import { CheckinToken } from '../models/CheckinToken.js';
import { Membership } from '../models/Membership.js';
import { Notification } from '../models/Notification.js';
import { Shop } from '../models/Shop.js';
import { User } from '../models/User.js';
import { recordVisitForOwner } from './loyalty.service.js';
import type {
  CheckinVerifyResult,
  EntityId,
  GenerateCheckinTokenInput,
  GenerateCheckinTokenResult,
  GenerateOrderCodeInput,
  GenerateOrderCodeResult,
  VerifyCheckinTokenInput,
  VerifyOrderCodeInput,
} from './types.js';

const toObjectId = (id: EntityId): Types.ObjectId =>
  new Types.ObjectId(id.toString());

// ─────────────────────────────────────────────────────────────────────────────
// GENERATE QR / BARCODE TOKEN — physical shops
// ─────────────────────────────────────────────────────────────────────────────

export const generateCheckinToken = async (
  input: GenerateCheckinTokenInput
): Promise<GenerateCheckinTokenResult> => {
  const customerId = toObjectId(input.customerId);

  // invalidate any existing unused tokens for this customer
  await CheckinToken.updateMany(
    { customerId, isUsed: false, tokenType: { $in: ['qr', 'barcode'] } },
    { $set: { isUsed: true, usedAt: new Date() } }
  );

  const token     = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  await CheckinToken.create({
    customerId,
    token,
    tokenType:     'qr',
    expiresAt,
    isUsed:        false,
    qrFormat:      `loyyo://checkin/${token}`,
    barcodeFormat: token,
  });

  return {
    token,
    qrFormat:      `loyyo://checkin/${token}`,
    barcodeFormat: token,
    expiresAt,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GENERATE ORDER CODE — home businesses
// ─────────────────────────────────────────────────────────────────────────────

export const generateOrderCode = async (
  input: GenerateOrderCodeInput
): Promise<GenerateOrderCodeResult> => {
  const customerId = toObjectId(input.customerId);
  const shopId     = toObjectId(input.shopId);

  // verify shop exists, is active and is a home business
  const shop = await Shop.findById(shopId).select('status businessType name').lean();
  if (!shop)                         throw new AppError('Shop not found', 404);
  if (shop.status !== 'active')      throw new AppError('This shop is not active', 403);
  if (shop.businessType !== 'home')  throw new AppError('Order codes are only for home businesses', 400);

  // verify customer is a member of this shop
  const membership = await Membership.findOne({ customerId, shopId, isActive: true }).lean();
  if (!membership) throw new AppError('You are not a member of this shop', 403);

  // invalidate any existing unused order codes for this customer + shop
  await CheckinToken.updateMany(
    { customerId, shopId, isUsed: false, tokenType: 'order_code' },
    { $set: { isUsed: true, usedAt: new Date() } }
  );

  // generate 6-digit numeric code
  const orderCode = String(Math.floor(100000 + Math.random() * 900000));
  const token     = crypto.randomUUID(); // internal unique token
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  await CheckinToken.create({
    customerId,
    shopId,
    token,
    tokenType:  'order_code',
    orderCode,
    expiresAt,
    isUsed:     false,
  });

  // notify customer with their order code
  await Notification.create({
    customerId,
    shopId,
    type:      'order_code',
    title:     `Your order code for ${shop.name}`,
    message:   `Your order code is: ${orderCode}. Valid for 24 hours. Share this with the shop when your order is ready.`,
    isRead:    false,
    emailSent: false,
  });

  return { orderCode, expiresAt };
};

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY QR / BARCODE TOKEN — physical shops
// ─────────────────────────────────────────────────────────────────────────────

export const verifyCheckinToken = async (
  input: VerifyCheckinTokenInput
): Promise<CheckinVerifyResult> => {
  const shopId = toObjectId(input.shopId);

  // verify shop exists and is active
  const shop = await Shop.findById(shopId)
    .select('status ownerId businessType')
    .lean();
  if (!shop)                    throw new AppError('Shop not found', 404);
  if (shop.status !== 'active') throw new AppError('Shop is not active', 403);
  if (shop.businessType === 'home') throw new AppError('Use order code verification for home businesses', 400);

  // find and validate token
  const checkinToken = await CheckinToken.findOne({ token: input.token }).lean();
  if (!checkinToken)               throw new AppError('Invalid token', 401);
  if (checkinToken.isUsed)         throw new AppError('Token has already been used', 401);
  if (new Date() > checkinToken.expiresAt) throw new AppError('Token has expired', 401);
  if (!['qr', 'barcode'].includes(checkinToken.tokenType))
    throw new AppError('Invalid token type', 400);

  // mark token as used
  await CheckinToken.findByIdAndUpdate(checkinToken._id, {
    $set: { isUsed: true, usedAt: new Date(), usedByDevice: input.usedByDevice, shopId },
  });

  // get customer
  const customer = await User.findById(checkinToken.customerId)
    .select('name email _id')
    .lean();
  if (!customer) throw new AppError('Customer not found', 404);

  // verify membership
  const membership = await Membership.findOne({
    customerId: checkinToken.customerId,
    shopId,
    isActive:   true,
  });
  if (!membership) throw new AppError('Customer is not a member of this shop', 403);

  // mark visit via loyalty service — reuse existing logic
  const visitResult = await recordVisitForOwner({
    ownerId:        shop.ownerId,
    customerEmail:  customer.email,
    serviceId:      input.serviceId,
    markedByMethod: input.usedByDevice === 'usb_scanner' ? 'barcode_scan' : 'qr_scan',
    checkinToken:   input.token,
    spendAmount:    input.spendAmount,
    productsBought: input.productsBought,
  });

  return {
    ...visitResult,
    customer: { name: customer.name, email: customer.email },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY ORDER CODE — home businesses
// ─────────────────────────────────────────────────────────────────────────────

export const verifyOrderCode = async (
  input: VerifyOrderCodeInput
): Promise<CheckinVerifyResult> => {
  const shopId = toObjectId(input.shopId);

  // verify shop exists, is active and is a home business
  const shop = await Shop.findById(shopId)
    .select('status ownerId businessType')
    .lean();
  if (!shop)                        throw new AppError('Shop not found', 404);
  if (shop.status !== 'active')     throw new AppError('Shop is not active', 403);
  if (shop.businessType !== 'home') throw new AppError('Order code verification is only for home businesses', 400);

  // find and validate order code
  const checkinToken = await CheckinToken.findOne({
    orderCode: input.orderCode,
    shopId,
    tokenType: 'order_code',
    isUsed:    false,
  }).lean();

  if (!checkinToken)               throw new AppError('Invalid or already used order code', 401);
  if (new Date() > checkinToken.expiresAt) throw new AppError('Order code has expired', 401);

  // mark token as used
  await CheckinToken.findByIdAndUpdate(checkinToken._id, {
    $set: { isUsed: true, usedAt: new Date() },
  });

  // get customer
  const customer = await User.findById(checkinToken.customerId)
    .select('name email _id')
    .lean();
  if (!customer) throw new AppError('Customer not found', 404);

  // verify membership
  const membership = await Membership.findOne({
    customerId: checkinToken.customerId,
    shopId,
    isActive:   true,
  });
  if (!membership) throw new AppError('Customer is not a member of this shop', 403);

  // mark visit via loyalty service
  const visitResult = await recordVisitForOwner({
    ownerId:        shop.ownerId,
    customerEmail:  customer.email,
    serviceId:      input.serviceId,
    markedByMethod: 'order_code',
    spendAmount:    input.spendAmount,
    productsBought: input.productsBought,
  });

  return {
    ...visitResult,
    customer: { name: customer.name, email: customer.email },
  };
};