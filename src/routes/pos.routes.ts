import { Router } from 'express';
import * as posController from '../controllers/pos.controller.js';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/role.js';
import { protectPosToken } from '../middleware/posAuth.js';
import { validate } from '../middleware/validate.js';
import {
  markPosVisitSchema,
  validatePosTokenSchema,
} from '../validators/pos.schemas.js'
const router = Router();

// ── shop routes — authenticated shop rotates their POS token ─────────────────
router.post('/token/rotate',
  protect,
  restrictTo('shop'),
  posController.rotatePosToken
);

// ── POS device validates its token on startup ─────────────────────────────────
router.post('/validate',
  validate({ body: validatePosTokenSchema }),
  posController.validatePosToken
);

// ── POS device marks a visit ──────────────────────────────────────────────────
router.post('/visit',
  protectPosToken,
  validate({ body: markPosVisitSchema }),
  posController.markVisit
);

export default router;
