import crypto from 'crypto';
import { Types } from 'mongoose';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { Payment, type IPayment } from '../models/Payment.js';
import { Shop } from '../models/Shop.js';
import type {
  AdminPaymentsInput,
  CreatePaymentIntentInput,
  PaginatedResult,
  PayHereWebhookInput,
  PaymentIntentResult,
} from './types.js';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const planAmounts: Record<'micro' | 'basic' | 'standard' | 'premium', number> = {
  micro:    299,
  basic:    1500,
  standard: 3500,
  premium:  7500,
};

const PAYHERE_CHECKOUT_URL = 'https://www.payhere.lk/pay/checkout';

const paginate = <T>(items: T[], total: number, page = 1, limit = 20): PaginatedResult<T> => ({
  items,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate PayHere MD5 hash
 * Formula: MD5(merchant_id + order_id + amount + currency + MD5(merchant_secret).toUpperCase())
 */
const generatePayHereHash = (
  orderId:  string,
  amount:   number,
  currency: string
): string => {
  const merchantId     = env.payhere.merchantId;
  const merchantSecret = env.payhere.secret;

  const hashedSecret = crypto
    .createHash('md5')
    .update(merchantSecret)
    .digest('hex')
    .toUpperCase();

  const amountFormatted = amount.toFixed(2);

  const hashString = `${merchantId}${orderId}${amountFormatted}${currency}${hashedSecret}`;

  return crypto
    .createHash('md5')
    .update(hashString)
    .digest('hex')
    .toUpperCase();
};

/**
 * Verify PayHere webhook notification signature
 * Formula: MD5(merchant_id + order_id + amount + currency + status_code + MD5(merchant_secret).toUpperCase())
 */
const verifyWebhookSignature = (payload: Record<string, unknown>): boolean => {
  const merchantId     = env.payhere.merchantId;
  const merchantSecret = env.payhere.secret;

  const orderId    = String(payload.order_id    ?? payload.orderId    ?? '');
  const amount     = String(payload.amount      ?? '');
  const currency   = String(payload.currency    ?? 'LKR');
  const statusCode = String(payload.status_code ?? payload.status ?? '');
  const md5sig     = String(payload.md5sig      ?? '');

  if (!md5sig) return true; // no signature provided — skip in dev/test

  const hashedSecret = crypto
    .createHash('md5')
    .update(merchantSecret)
    .digest('hex')
    .toUpperCase();

  const hashString = `${merchantId}${orderId}${amount}${currency}${statusCode}${hashedSecret}`;

  const expected = crypto
    .createHash('md5')
    .update(hashString)
    .digest('hex')
    .toUpperCase();

  return expected === md5sig.toUpperCase();
};

// ─────────────────────────────────────────────────────────────────────────────
// CREATE PAYMENT INTENT
// ─────────────────────────────────────────────────────────────────────────────

export const createPaymentIntent = async (
  input: CreatePaymentIntentInput
): Promise<PaymentIntentResult> => {
  const shop = await Shop.findOne({
    ownerId: new Types.ObjectId(input.ownerId.toString()),
  }).select('_id businessType').lean();
  if (!shop) throw new AppError('Shop not found for this owner', 404);

  // micro plan only for home businesses
  if (input.plan === 'micro' && shop.businessType !== 'home') {
    throw new AppError('Micro plan is only available for home businesses', 403);
  }

  const amount    = planAmounts[input.plan];
  const currency  = 'LKR';
  const reference = `loyyo_${Date.now()}_${shop._id}`;

  const payment = await Payment.create({
    shopId:           shop._id,
    plan:             input.plan,
    amount,
    currency,
    status:           'pending',
    payhereReference: reference,
  });

  // build the signed PayHere checkout payload the frontend submits directly
  const hash = generatePayHereHash(reference, amount, currency);

  const checkoutPayload = {
    merchant_id:  env.payhere.merchantId,
    return_url:   `${env.app.frontendUrl}/payment/success`,
    cancel_url:   `${env.app.frontendUrl}/payment/cancel`,
    notify_url:   `${env.app.apiUrl}/api/v1/payments/payhere/webhook`,
    order_id:     reference,
    items:        `Loyyo ${input.plan.charAt(0).toUpperCase() + input.plan.slice(1)} Plan`,
    currency,
    amount:       amount.toFixed(2),
    hash,
  };

  return {
    payment,
    redirectUrl: PAYHERE_CHECKOUT_URL,
    payload:     checkoutPayload,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// HANDLE PAYHERE WEBHOOK
// ─────────────────────────────────────────────────────────────────────────────

export const handlePayHereWebhook = async (
  input: PayHereWebhookInput
): Promise<IPayment> => {
  // verify signature
  if (!verifyWebhookSignature(input.payload)) {
    throw new AppError('Invalid webhook signature', 401);
  }

  const reference = String(
    input.payload.order_id         ??
    input.payload.orderId          ??
    input.payload.payhereReference ??
    input.payload.reference        ??
    ''
  );
  const paymentId  = input.payload.payment_id ?? input.payload.payherePaymentId;
  const statusCode = String(input.payload.status_code ?? input.payload.status ?? '');
  const status     = statusCode === '2' || statusCode.toLowerCase() === 'paid'
    ? 'paid'
    : 'failed';

  const payment = await Payment.findOneAndUpdate(
    { payhereReference: reference },
    { $set: { status, payherePaymentId: paymentId ? String(paymentId) : undefined } },
    { new: true, runValidators: true }
  );

  if (!payment) throw new AppError('Payment not found for webhook reference', 404);

  if (payment.status === 'paid') {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    await Shop.findByIdAndUpdate(payment.shopId, {
      $set: {
        plan:          payment.plan,
        planExpiresAt: expiresAt,
      },
    });
  }

  return payment;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET SHOP PAYMENT HISTORY
// ─────────────────────────────────────────────────────────────────────────────

export const getMyPayments = async (
  ownerId: string | Types.ObjectId,
  page  = 1,
  limit = 20
): Promise<PaginatedResult<IPayment>> => {
  const shop = await Shop.findOne({
    ownerId: new Types.ObjectId(ownerId.toString()),
  }).select('_id').lean();
  if (!shop) throw new AppError('Shop not found for this owner', 404);

  const filter = { shopId: shop._id };

  const [items, total] = await Promise.all([
    Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Payment.countDocuments(filter),
  ]);

  return paginate(items as IPayment[], total, page, limit);
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — LIST ALL PAYMENTS
// ─────────────────────────────────────────────────────────────────────────────

export const getAdminPayments = async (
  input: AdminPaymentsInput
): Promise<PaginatedResult<IPayment>> => {
  const page  = input.page  ?? 1;
  const limit = input.limit ?? 20;
  const filter: Record<string, unknown> = {};
  if (input.status) filter.status = input.status;
  if (input.plan)   filter.plan   = input.plan;

  const [items, total] = await Promise.all([
    Payment.find(filter)
      .populate('shopId', 'name type businessType status')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Payment.countDocuments(filter),
  ]);

  return paginate(items as IPayment[], total, page, limit);
};
