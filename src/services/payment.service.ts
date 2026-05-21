import type { IPayment } from '../models/Payment.js';
import type {
  AdminPaymentsInput,
  CreatePaymentIntentInput,
  PaginatedResult,
  PayHereWebhookInput,
  PaymentIntentResult,
} from './types.js';
import { notImplemented } from './notImplemented.js';

const serviceName = 'payment.service';

export const createPaymentIntent = async (
  _input: CreatePaymentIntentInput
): Promise<PaymentIntentResult> => {
  return notImplemented(serviceName, 'createPaymentIntent');
};

export const handlePayHereWebhook = async (_input: PayHereWebhookInput): Promise<IPayment> => {
  return notImplemented(serviceName, 'handlePayHereWebhook');
};

export const getAdminPayments = async (
  _input: AdminPaymentsInput
): Promise<PaginatedResult<IPayment>> => {
  return notImplemented(serviceName, 'getAdminPayments');
};
