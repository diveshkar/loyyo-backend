import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerCustomerSchema,
  registerShopSchema,
} from '../validators/auth.schemas.js';

const router = Router();

router.post('/register', validate({ body: registerCustomerSchema }), authController.registerCustomer);
router.post('/login', validate({ body: loginSchema }), authController.loginCustomer);
router.post('/shop/register', validate({ body: registerShopSchema }), authController.registerShop);
router.post('/shop/login', validate({ body: loginSchema }), authController.loginShop);
router.post('/refresh', validate({ body: refreshTokenSchema }), authController.refreshToken);
router.post('/logout', protect, validate({ body: logoutSchema }), authController.logout);

export default router;
