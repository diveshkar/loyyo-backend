import * as offerService from '../services/offer.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/http.js';

export const getCustomerOffers = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await offerService.getCustomerOffers({
    customerId: authReq.user!._id,
    page:       Number(req.query.page),
    limit:      Number(req.query.limit),
  });
  sendSuccess(res, result);
});

export const getOfferById = asyncHandler(async (req, res) => {
  const result = await offerService.getOfferById({
    offerId: String(req.params.id),
  });
  sendSuccess(res, result);
});

export const getShopOffers = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await offerService.getShopOffers({
    ownerId:  authReq.user!._id,
    isActive: req.query.isActive !== undefined
      ? req.query.isActive === 'true'
      : undefined,
    page:     Number(req.query.page),
    limit:    Number(req.query.limit),
  });
  sendSuccess(res, result);
});

export const getShopOfferById = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await offerService.getShopOfferById({
    ownerId: authReq.user!._id,
    offerId: String(req.params.id),
  });
  sendSuccess(res, result);
});

export const createOffer = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await offerService.createOffer({
    ownerId: authReq.user!._id,
    ...req.body,
  });
  sendSuccess(res, result, 201);
});

export const updateOffer = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await offerService.updateOffer({
    ownerId: authReq.user!._id,
    offerId: String(req.params.id),
    ...req.body,
  });
  sendSuccess(res, result);
});

export const deleteOffer = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  await offerService.deleteOffer({
    ownerId: authReq.user!._id,
    offerId: String(req.params.id),
  });
  sendSuccess(res, { deleted: true });
});

export const boostOfferAsAd = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await offerService.boostOfferAsAd({
    ownerId:      authReq.user!._id,
    offerId:      String(req.params.id),
    weeklyBudget: req.body.weeklyBudget,
    endDate:      req.body.endDate,
    startDate:    req.body.startDate,
  });
  sendSuccess(res, result, 201);
});