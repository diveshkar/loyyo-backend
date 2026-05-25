import * as authService from '../services/auth.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/http.js';

// ─── REGISTER / LOGIN ─────────────────────────────────────────────────────────

export const registerCustomer = asyncHandler(async (req, res) => {
  const result = await authService.registerCustomer(req.body);
  sendSuccess(res, result, 201);
});

export const loginCustomer = asyncHandler(async (req, res) => {
  const result = await authService.loginCustomer(req.body);
  sendSuccess(res, result);
});

export const registerShop = asyncHandler(async (req, res) => {
  const result = await authService.registerShop(req.body);
  sendSuccess(res, result, 201);
});

export const loginShop = asyncHandler(async (req, res) => {
  const result = await authService.loginShop(req.body);
  sendSuccess(res, result);
});

export const loginAdmin = asyncHandler(async (req, res) => {
  const result = await authService.loginAdmin(req.body);
  sendSuccess(res, result);
});

// ─── TOKEN MANAGEMENT ─────────────────────────────────────────────────────────

export const refreshToken = asyncHandler(async (req, res) => {
  const result = await authService.refreshToken(req.body);
  sendSuccess(res, result);
});

export const logout = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  await authService.logout({
    userId:       authReq.user!._id,
    refreshToken: req.body.refreshToken,
  });
  sendSuccess(res, { loggedOut: true });
});

// ─── PASSWORD MANAGEMENT ──────────────────────────────────────────────────────

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword({ email: req.body.email });
  sendSuccess(res, {
    message: 'If an account exists with this email a reset link has been sent',
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword({
    token:       req.body.token,
    newPassword: req.body.newPassword,
  });
  sendSuccess(res, { message: 'Password reset successfully' });
});

export const changePassword = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  await authService.changePassword({
    userId:      authReq.user!._id,
    oldPassword: req.body.oldPassword,
    newPassword: req.body.newPassword,
  });
  sendSuccess(res, { message: 'Password changed successfully' });
});