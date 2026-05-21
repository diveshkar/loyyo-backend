import * as paymentService from '../services/payment.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getClientIp, sendSuccess } from '../utils/http.js';

export const createPaymentIntent = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await paymentService.createPaymentIntent({
    ownerId: authReq.user!._id,
    plan: req.body.plan,
  });
  sendSuccess(res, result, 201);
});

export const handlePayHereWebhook = asyncHandler(async (req, res) => {
  const result = await paymentService.handlePayHereWebhook({
    payload: req.body,
    signature: req.headers['x-payhere-signature'] as string | undefined,
    ip: getClientIp(req),
  });
  sendSuccess(res, result);
});
