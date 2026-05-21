import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import {
  createPaymentIntentSchema,
  payHereWebhookSchema,
} from '../validators/payment.schemas.js';

const router = Router();

router.post('/intent', protect, restrictTo('shop'), validate({ body: createPaymentIntentSchema }), paymentController.createPaymentIntent);
router.post('/payhere/webhook', validate({ body: payHereWebhookSchema }), paymentController.handlePayHereWebhook);

export default router;
