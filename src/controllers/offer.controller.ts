import * as offerService from '../services/offer.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/http.js';

export const getCustomerOffers = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await offerService.getCustomerOffers({
    customerId: authReq.user!._id,
    page: Number(req.query.page),
    limit: Number(req.query.limit),
  });
  sendSuccess(res, result);
});

export const createOffer = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await offerService.createOffer({
    ownerId: authReq.user!._id,
    ...req.body,
  });
  sendSuccess(res, result, 201);
});

export const updateOffer = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await offerService.updateOffer({
    ownerId: authReq.user!._id,
    offerId: String(req.params.id),
    ...req.body,
  });
  sendSuccess(res, result);
});
