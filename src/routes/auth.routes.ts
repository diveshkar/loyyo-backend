import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerCustomerSchema,
  registerShopSchema,
  resetPasswordSchema,
} from '../validators/auth.schemas.js';

const router = Router();

// ─── CUSTOMER ─────────────────────────────────────────────────────────────────

router.post(
  '/register',
  validate({ body: registerCustomerSchema }),
  authController.registerCustomer
);

router.post(
  '/login',
  validate({ body: loginSchema }),
  authController.loginCustomer
);

// ─── SHOP ─────────────────────────────────────────────────────────────────────

router.post(
  '/shop/register',
  validate({ body: registerShopSchema }),
  authController.registerShop
);

router.post(
  '/shop/login',
  validate({ body: loginSchema }),
  authController.loginShop
);

// ─── ADMIN ────────────────────────────────────────────────────────────────────

router.post(
  '/admin/login',
  validate({ body: loginSchema }),
  authController.loginAdmin
);

// ─── TOKEN MANAGEMENT ─────────────────────────────────────────────────────────

router.post(
  '/refresh',
  validate({ body: refreshTokenSchema }),
  authController.refreshToken
);

router.post(
  '/logout',
  protect,
  validate({ body: logoutSchema }),
  authController.logout
);

// ─── PASSWORD MANAGEMENT ──────────────────────────────────────────────────────

router.post(
  '/forgot-password',
  validate({ body: forgotPasswordSchema }),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  validate({ body: resetPasswordSchema }),
  authController.resetPassword
);

router.patch(
  '/change-password',
  protect,
  validate({ body: changePasswordSchema }),
  authController.changePassword
);

export default router;