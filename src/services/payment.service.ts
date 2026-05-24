import { Types } from 'mongoose';
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

const planAmounts: Record<'basic' | 'standard' | 'premium', number> = {
  basic: 1500,
  standard: 3500,
  premium: 7500,
};

const paginate = <T>(items: T[], total: number, page = 1, limit = 20): PaginatedResult<T> => ({
  items,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});

export const createPaymentIntent = async (
  input: CreatePaymentIntentInput
): Promise<PaymentIntentResult> => {
  const shop = await Shop.findOne({ ownerId: new Types.ObjectId(input.ownerId.toString()) }).select('_id').lean();
  if (!shop) throw new AppError('Shop not found for this owner', 404);

  const payment = await Payment.create({
    shopId: shop._id,
    plan: input.plan,
    amount: planAmounts[input.plan],
    currency: 'LKR',
    status: 'pending',
    payhereReference: `loyyo_${Date.now()}_${shop._id}`,
  });

  return {
    payment,
    payload: {
      paymentId: payment._id,
      reference: payment.payhereReference,
      amount: payment.amount,
      currency: payment.currency,
      plan: payment.plan,
    },
  };
};

export const handlePayHereWebhook = async (input: PayHereWebhookInput): Promise<IPayment> => {
  const reference = String(
    input.payload.order_id ??
      input.payload.orderId ??
      input.payload.payhereReference ??
      input.payload.reference ??
      ''
  );
  const paymentId = input.payload.payment_id ?? input.payload.payherePaymentId;
  const statusCode = String(input.payload.status_code ?? input.payload.status ?? '');
  const status = statusCode === '2' || statusCode.toLowerCase() === 'paid' ? 'paid' : 'failed';

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
        plan: payment.plan,
        planExpiresAt: expiresAt,
      },
    });
  }

  return payment;
};

export const getAdminPayments = async (
  input: AdminPaymentsInput
): Promise<PaginatedResult<IPayment>> => {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;
  const filter: Record<string, unknown> = {};
  if (input.status) filter.status = input.status;
  if (input.plan) filter.plan = input.plan;

  const [items, total] = await Promise.all([
    Payment.find(filter)
      .populate('shopId', 'name type status')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Payment.countDocuments(filter),
  ]);

  return paginate(items as IPayment[], total, page, limit);
};
