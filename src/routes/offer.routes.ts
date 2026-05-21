import { Router } from 'express';
import * as offerController from '../controllers/offer.controller.js';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import {
  createOfferSchema,
  customerOffersQuerySchema,
  offerIdParamSchema,
  updateOfferSchema,
} from '../validators/offer.schemas.js';

const router = Router();

router.get('/', protect, restrictTo('customer'), validate({ query: customerOffersQuerySchema }), offerController.getCustomerOffers);
router.post('/', protect, restrictTo('shop'), validate({ body: createOfferSchema }), offerController.createOffer);
router.patch('/:id', protect, restrictTo('shop'), validate({ params: offerIdParamSchema, body: updateOfferSchema }), offerController.updateOffer);

export default router;
