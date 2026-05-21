import { Router } from 'express';
import * as posController from '../controllers/pos.controller.js';
import { protectPosToken } from '../middleware/posAuth.js';
import { validate } from '../middleware/validate.js';
import { markVisitSchema } from '../validators/loyalty.schemas.js';

const router = Router();

router.post('/loyalty/visit', protectPosToken, validate({ body: markVisitSchema }), posController.markVisit);

export default router;
