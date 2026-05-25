import * as loyaltyService from '../services/loyalty.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/http.js';
import { EntityId } from '../services/types.js';

// ─── LOYALTY RULES ────────────────────────────────────────────────────────────

export const createOrUpdateRule = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await loyaltyService.createOrUpdateRuleForOwner({
    ownerId:           authReq.user!._id,
    serviceId:         req.body.serviceId,
    title:             req.body.title,
    loyaltyType:       req.body.loyaltyType,
    config:            req.body.config,
    reward:            req.body.reward,
    visitsRequired:    req.body.visitsRequired,
    rewardDescription: req.body.rewardDescription,
  });
  sendSuccess(res, result, 201);
});

export const getCurrentRule = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await loyaltyService.getAllActiveRules({
    ownerId: authReq.user!._id,
  });
  sendSuccess(res, result);
});

export const getRuleHistory = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await loyaltyService.getRuleHistory({
    ownerId: authReq.user!._id,
  });
  sendSuccess(res, result);
});

export const deleteRule = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await loyaltyService.deleteRule({
    ownerId: authReq.user!._id,
    ruleId:  req.params.ruleId as EntityId,
  });
  sendSuccess(res, result);
});

// ─── VISIT MARKING ────────────────────────────────────────────────────────────

export const markVisit = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await loyaltyService.recordVisitForOwner({
    ownerId:          authReq.user!._id,
    customerEmail:    req.body.customerEmail,
    serviceId:        req.body.serviceId,
    markedByMethod:   'manual',
    checkinToken:     req.body.checkinToken,
    locationVerified: req.body.locationVerified,
    customerLat:      req.body.customerLat,
    customerLng:      req.body.customerLng,
    spendAmount:      req.body.spendAmount,
    productsBought:   req.body.productsBought,
  });
  sendSuccess(res, result, 201);
});

export const getVisitHistory = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await loyaltyService.getVisitHistory({
    membershipId: String(req.params.membershipId),
    requesterId:  authReq.user!._id,
    page:         Number(req.query.page),
    limit:        Number(req.query.limit),
  });
  sendSuccess(res, result);
});

// ─── MEMBERS ──────────────────────────────────────────────────────────────────

export const getShopMembers = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await loyaltyService.getShopMembers({
    ownerId: authReq.user!._id,
    search:  req.query.search as string | undefined,
    page:    Number(req.query.page),
    limit:   Number(req.query.limit),
  });
  sendSuccess(res, result);
});

export const getShopMemberById = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await loyaltyService.getShopMemberById({
    ownerId:      authReq.user!._id,
    membershipId: req.params.membershipId as EntityId,
  });
  sendSuccess(res, result);
});

// ─── MEMBERSHIP ───────────────────────────────────────────────────────────────

export const joinShop = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await loyaltyService.joinShop({
    customerId: authReq.user!._id,
    shopId:     req.params.shopId as EntityId,
  });
  sendSuccess(res, result, 201);
});

export const leaveShop = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  await loyaltyService.leaveShop({
    customerId: authReq.user!._id,
    shopId:     req.params.shopId as EntityId,
  });
  sendSuccess(res, { left: true });
});

export const getMyMemberships = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await loyaltyService.getMyMemberships({
    customerId: authReq.user!._id,
    page:       Number(req.query.page),
    limit:      Number(req.query.limit),
  });
  sendSuccess(res, result);
});

export const getMembershipCard = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await loyaltyService.getMembershipCard({
    customerId: authReq.user!._id,
    shopId:     req.params.shopId as EntityId,
  });
  sendSuccess(res, result);
});

// ─── REWARDS ──────────────────────────────────────────────────────────────────

export const getMyRewards = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await loyaltyService.getMyRewards({
    customerId: authReq.user!._id,
    page:       Number(req.query.page),
    limit:      Number(req.query.limit),
  });
  sendSuccess(res, result);
});

export const redeemReward = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await loyaltyService.redeemReward({
    rewardId: req.params.rewardId as EntityId,
    ownerId:  authReq.user!._id,
  });
  sendSuccess(res, result);
});