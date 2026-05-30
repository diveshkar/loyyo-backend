import * as shopService from '../services/shop.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/http.js';

export const getCurrentShopProfile = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await shopService.getCurrentShopProfile({ ownerId: authReq.user!._id });
  sendSuccess(res, result);
});

export const updateCurrentShopProfile = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await shopService.updateCurrentShopProfile({
    ownerId: authReq.user!._id,
    ...req.body,
  });
  sendSuccess(res, result);
});

export const getPublicShopProfile = asyncHandler(async (req, res) => {
  const result = await shopService.getPublicShopProfile({ shopId: String(req.params.id) });
  sendSuccess(res, result);
});

export const getNearbyShops = asyncHandler(async (req, res) => {
  const result = await shopService.getNearbyShops({
    latitude: Number(req.query.latitude),
    longitude: Number(req.query.longitude),
    radiusKm: req.query.radiusKm ? Number(req.query.radiusKm) : undefined,
    type: req.query.type as any,
    category: req.query.category as string | undefined,
    page: Number(req.query.page),
    limit: Number(req.query.limit),
  });
  sendSuccess(res, result);
});

export const getShopStats = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await shopService.getShopStats({
    ownerId: authReq.user!._id,
    from: req.query.from ? new Date(req.query.from as string) : undefined,
    to: req.query.to ? new Date(req.query.to as string) : undefined,
  });
  sendSuccess(res, result);
});

export const rotateShopApiToken = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await shopService.rotateShopApiToken({ ownerId: authReq.user!._id });
  sendSuccess(res, result);
});

export const getSubscriptionStatus = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await shopService.getSubscriptionStatus({ ownerId: authReq.user!._id });
  sendSuccess(res, result);
});

export const searchShopsToJoin = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await shopService.searchShopsToJoin({
    customerId: authReq.user!._id,
    query: req.query.query as string | undefined,
    type: req.query.type as any,
    category: req.query.category as string | undefined,
    page: Number(req.query.page),
    limit: Number(req.query.limit),
  });
  sendSuccess(res, result);
});

export const getServiceList = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await shopService.getServiceList({ ownerId: authReq.user!._id });
  sendSuccess(res, result);
});

export const createService = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await shopService.createService({
    ownerId: authReq.user!._id,
    ...req.body,
  });
  sendSuccess(res, result, 201);
});

export const updateService = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await shopService.updateService({
    ownerId: authReq.user!._id,
    serviceId: String(req.params.serviceId),
    ...req.body,
  });
  sendSuccess(res, result);
});

export const deleteService = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  await shopService.deleteService({
    ownerId: authReq.user!._id,
    serviceId: String(req.params.serviceId),
  });
  sendSuccess(res, { deleted: true });
});

export const getPosterUsageStatus = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await shopService.getPosterUsageStatus({ ownerId: authReq.user!._id });
  sendSuccess(res, result);
});
