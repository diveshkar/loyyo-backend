import * as adminService from '../services/admin.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getClientIp, sendSuccess } from '../utils/http.js';

export const getAdminShops = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await adminService.getAdminShops({
    adminId: authReq.user!._id,
    status:  req.query.status as never,
    search:  req.query.search as string | undefined,
    page:    Number(req.query.page),
    limit:   Number(req.query.limit),
  });
  sendSuccess(res, result);
});

export const approveShop = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await adminService.approveShop({
    adminId: authReq.user!._id,
    shopId:  String(req.params.id),
    ip:      getClientIp(req),
  });
  sendSuccess(res, result);
});

export const suspendShop = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await adminService.suspendShop({
    adminId: authReq.user!._id,
    shopId:  String(req.params.id),
    reason:  req.body.reason,
    ip:      getClientIp(req),
  });
  sendSuccess(res, result);
});

export const reinstateShop = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await adminService.reinstateShop({
    adminId: authReq.user!._id,
    shopId:  String(req.params.id),
    ip:      getClientIp(req),
  });
  sendSuccess(res, result);
});

export const getAdminUsers = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await adminService.getAdminUsers({
    adminId: authReq.user!._id,
    search:  req.query.search as string | undefined,
    page:    Number(req.query.page),
    limit:   Number(req.query.limit),
  });
  sendSuccess(res, result);
});

export const getAdminPayments = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await adminService.getAdminPayments({
    adminId: authReq.user!._id,
    status:  req.query.status as never,
    plan:    req.query.plan as never,
    page:    Number(req.query.page),
    limit:   Number(req.query.limit),
  });
  sendSuccess(res, result);
});

export const getAdminAds = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await adminService.getAdminAds({
    adminId:  authReq.user!._id,
    isActive: req.query.isActive as boolean | undefined,
    page:     Number(req.query.page),
    limit:    Number(req.query.limit),
  });
  sendSuccess(res, result);
});

export const approveAd = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await adminService.approveAd({
    adminId: authReq.user!._id,
    adId:    String(req.params.id),
    reason:  req.body.reason,
  });
  sendSuccess(res, result);
});

export const pauseAd = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await adminService.pauseAd({
    adminId: authReq.user!._id,
    adId:    String(req.params.id),
    reason:  req.body.reason,
  });
  sendSuccess(res, result);
});

export const removeAd = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await adminService.removeAd({
    adminId: authReq.user!._id,
    adId:    String(req.params.id),
    reason:  req.body.reason,
    ip:      getClientIp(req),
  });
  sendSuccess(res, result);
});

export const getAuditLogs = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result = await adminService.getAuditLogs({
    adminId:    authReq.user!._id,
    action:     req.query.action as never,
    targetType: req.query.targetType as never,
    from:       req.query.from ? new Date(req.query.from as string) : undefined,
    to:         req.query.to   ? new Date(req.query.to   as string) : undefined,
    page:       Number(req.query.page),
    limit:      Number(req.query.limit),
  });
  sendSuccess(res, result);
});

export const getPlatformStats = asyncHandler(async (_req, res) => {
  const result = await adminService.getPlatformStats();
  sendSuccess(res, result);
});

export const deactivateUser = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await adminService.deactivateUser({
    adminId: authReq.user!._id,
    userId:  String(req.params.id),
    reason:  req.body.reason,
    ip:      getClientIp(req),
  });
  sendSuccess(res, result);
});

export const refundPayment = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const result  = await adminService.refundPayment({
    adminId:   authReq.user!._id,
    paymentId: String(req.params.id),
    reason:    req.body.reason,
    ip:        getClientIp(req),
  });
  sendSuccess(res, result);
});
