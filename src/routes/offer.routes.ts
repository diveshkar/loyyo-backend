import { Router } from 'express';
import * as offerController from '../controllers/offer.controller.js';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import {
  boostOfferSchema,
  createOfferSchema,
  customerOffersQuerySchema,
  offerIdParamSchema,
  shopOffersQuerySchema,
  updateOfferSchema,
} from '../validators/offer.schemas.js';

const router = Router();

// ── shop routes ───────────────────────────────────────────────────────────────
router.get('/shop',          protect, restrictTo('shop'),     validate({ query: shopOffersQuerySchema }),                        offerController.getShopOffers);
router.get('/shop/:id',      protect, restrictTo('shop'),     validate({ params: offerIdParamSchema }),                          offerController.getShopOfferById);
router.post('/',             protect, restrictTo('shop'),     validate({ body: createOfferSchema }),                             offerController.createOffer);
router.patch('/:id',         protect, restrictTo('shop'),     validate({ params: offerIdParamSchema, body: updateOfferSchema }), offerController.updateOffer);
router.delete('/:id',        protect, restrictTo('shop'),     validate({ params: offerIdParamSchema }),                          offerController.deleteOffer);
router.post('/:id/boost',    protect, restrictTo('shop'),     validate({ params: offerIdParamSchema, body: boostOfferSchema }),  offerController.boostOfferAsAd);

// ── customer routes ───────────────────────────────────────────────────────────
router.get('/customer',      protect, restrictTo('customer'), validate({ query: customerOffersQuerySchema }),                    offerController.getCustomerOffers);

// ── public routes ─────────────────────────────────────────────────────────────
router.get('/:id',           validate({ params: offerIdParamSchema }),                                                           offerController.getOfferById);

export default router;