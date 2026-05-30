import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimit.js';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerCustomerSchema,
  registerShopSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from '../validators/auth.schemas.js';

const router = Router();

// ─── CUSTOMER ─────────────────────────────────────────────────────────────────

router.post('/register',       authLimiter, validate({ body: registerCustomerSchema }), authController.registerCustomer);
router.post('/login',          authLimiter, validate({ body: loginSchema }),             authController.loginCustomer);

// ─── SHOP ─────────────────────────────────────────────────────────────────────

router.post('/shop/register',  authLimiter, validate({ body: registerShopSchema }),     authController.registerShop);
router.post('/shop/login',     authLimiter, validate({ body: loginSchema }),             authController.loginShop);

// ─── ADMIN ────────────────────────────────────────────────────────────────────

router.post('/admin/login',    authLimiter, validate({ body: loginSchema }),             authController.loginAdmin);

// ─── TOKEN MANAGEMENT ─────────────────────────────────────────────────────────

router.post('/refresh',        validate({ body: refreshTokenSchema }),                  authController.refreshToken);
router.post('/logout',         protect, validate({ body: logoutSchema }),               authController.logout);

// ─── PASSWORD MANAGEMENT ──────────────────────────────────────────────────────

router.post('/forgot-password',  authLimiter, validate({ body: forgotPasswordSchema }), authController.forgotPassword);
router.post('/reset-password',   authLimiter, validate({ body: resetPasswordSchema }),  authController.resetPassword);
router.patch('/change-password', protect, validate({ body: changePasswordSchema }),     authController.changePassword);

// ─── PROFILE ──────────────────────────────────────────────────────────────────

router.get('/me',    protect, authController.getMe);
router.patch('/me',  protect, validate({ body: updateProfileSchema }), authController.updateMe);

export default router;