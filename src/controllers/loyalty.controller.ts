import * as loyaltyService from '../services/loyalty.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/http.js';
import { EntityId } from '../services/types.js';

// ─── LOYALTY RULES ────────────────────────────────────────────────────────────

export const createOrUpdateRule = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await loyaltyService.createOrUpdateRuleForOwner({
    ownerId:           authReq.user!._id,
    title:             req.body.title,
    visitsRequired:    req.body.visitsRequired,
    rewardDescription: req.body.rewardDescription,
  });
  sendSuccess(res, result, 201);
});

export const getCurrentRule = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await loyaltyService.getAllActiveRules({
    ownerId: authReq.user!._id,
  });
  sendSuccess(res, result);
});

export const getRuleHistory = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await loyaltyService.getRuleHistory({
    ownerId: authReq.user!._id,
  });
  sendSuccess(res, result);
});

// ─── VISIT MARKING ────────────────────────────────────────────────────────────

export const markVisit = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await loyaltyService.recordVisitForOwner({
    ownerId:       authReq.user!._id,
    customerEmail: req.body.customerEmail,
  });
  sendSuccess(res, result, 201);
});

export const getVisitHistory = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await loyaltyService.getVisitHistory({
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
  const result = await loyaltyService.getShopMembers({
    ownerId: authReq.user!._id,
    search:  req.query.search as string | undefined,
    page:    Number(req.query.page),
    limit:   Number(req.query.limit),
  });
  sendSuccess(res, result);
});

// ─── MEMBERSHIP ───────────────────────────────────────────────────────────────

export const joinShop = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await loyaltyService.joinShop({
    customerId: authReq.user!._id,
    shopId:     req.params.shopId as EntityId,
  });
  sendSuccess(res, result, 201);
});

export const getMyMemberships = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await loyaltyService.getMyMemberships({
    customerId: authReq.user!._id,
    page:       Number(req.query.page),
    limit:      Number(req.query.limit),
  });
  sendSuccess(res, result);
});

export const getMembershipCard = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await loyaltyService.getMembershipCard({
    customerId: authReq.user!._id,
    shopId:     req.params.shopId as EntityId,
  });
  sendSuccess(res, result);
});

// ─── REWARDS ──────────────────────────────────────────────────────────────────

export const getMyRewards = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await loyaltyService.getMyRewards({
    customerId: authReq.user!._id,
    page:       Number(req.query.page),
    limit:      Number(req.query.limit),
  });
  sendSuccess(res, result);
});

export const redeemReward = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await loyaltyService.redeemReward({
    rewardId: req.params.rewardId as EntityId,
    ownerId:  authReq.user!._id,
  });
  sendSuccess(res, result);
});