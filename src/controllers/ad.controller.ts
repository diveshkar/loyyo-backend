import * as adService from '../services/ad.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/http.js';
import { AdType, EntityId } from '../services/types.js';

// ─── CUSTOMER ─────────────────────────────────────────────────────────────────

export const getCustomerAdFeed = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await adService.getCustomerAdFeed({
    customerId: authReq.user!._id,
    page:       Number(req.query.page),
    limit:      Number(req.query.limit),
  });
  sendSuccess(res, result);
});

export const recordClick = asyncHandler(async (req, res) => {
  const result = await adService.recordClick({
    adId: req.params.id as EntityId,
  });
  sendSuccess(res, result);
});

// ─── SHOP ─────────────────────────────────────────────────────────────────────

export const createAdCampaign = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await adService.createAdCampaign({
    ownerId: authReq.user!._id,
    ...req.body,
  });
  sendSuccess(res, result, 201);
});

export const getShopAdCampaigns = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await adService.getShopAdCampaigns({
    ownerId:  authReq.user!._id,
    page:     Number(req.query.page),
    limit:    Number(req.query.limit),
    isActive: req.query.isActive !== undefined
      ? req.query.isActive === 'true'
      : undefined,
    adType: req.query.adType as AdType | undefined,
  });
  sendSuccess(res, result);
});

export const getShopAdStats = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await adService.getShopAdStats({
    ownerId: authReq.user!._id,
    from:    req.query.from ? new Date(req.query.from as string) : undefined,
    to:      req.query.to   ? new Date(req.query.to   as string) : undefined,
  });
  sendSuccess(res, result);
});

export const updateAdCampaign = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await adService.updateAdCampaign({
    ownerId: authReq.user!._id,
    adId:    req.params.id,
    ...req.body,
  });
  sendSuccess(res, result);
});

export const deleteAdCampaign = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await adService.deleteAdCampaign({
    ownerId: authReq.user!._id,
    adId:    req.params.id as EntityId,
  });
  sendSuccess(res, result);
});

// ─── AI POSTER ────────────────────────────────────────────────────────────────

export const generatePoster = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await adService.generatePoster({
    ownerId: authReq.user!._id,
    ...req.body,
  });
  sendSuccess(res, result);
});

export const detectObject = asyncHandler(async (req, res) => {
  const result = await adService.detectObject({
    imageUrl:   req.body.imageUrl,
    maskRegion: req.body.maskRegion,
  });
  sendSuccess(res, result);
});

export const inpaintPoster = asyncHandler(async (req, res) => {
  const result = await adService.inpaintPoster({
    imageUrl:    req.body.imageUrl,
    maskRegion:  req.body.maskRegion,
    replaceWith: req.body.replaceWith,
    style:       req.body.style,
  });
  sendSuccess(res, result);
});

export const regeneratePoster = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await adService.regeneratePoster({
    ownerId:         authReq.user!._id,
    originalPrompt:  req.body.originalPrompt,
    updatedElements: req.body.updatedElements,
  });
  sendSuccess(res, result);
});

// ─── EXTERNAL ─────────────────────────────────────────────────────────────────

export const submitExternalAd = asyncHandler(async (req, res) => {
  const result = await adService.submitExternalAd(req.body);
  sendSuccess(res, result, 201);
});

// ─── ADMIN ────────────────────────────────────────────────────────────────────

export const adminGetAllAds = asyncHandler(async (req, res) => {
  const result = await adService.adminGetAllAds({
    adminId:  (req as AuthenticatedRequest).user!._id,
    page:     Number(req.query.page),
    limit:    Number(req.query.limit),
    isActive: req.query.isActive !== undefined
      ? req.query.isActive === 'true'
      : undefined,
    adType: req.query.adType as AdType | undefined,
  });
  sendSuccess(res, result);
});

export const adminPauseAd = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await adService.adminPauseAd({
    adminId: authReq.user!._id,
    adId:    req.params.id as EntityId,
    reason:  req.body.reason,
  });
  sendSuccess(res, result);
});

export const adminApproveAd = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await adService.adminApproveAd({
    adminId: authReq.user!._id,
    adId:    req.params.id as EntityId,
    reason:  req.body.reason,
  });
  sendSuccess(res, result);
});

export const adminDeleteAd = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await adService.adminDeleteAd({
    adminId: authReq.user!._id,
    adId:    req.params.id as EntityId,
    reason:  req.body.reason,
  });
  sendSuccess(res, result);
});