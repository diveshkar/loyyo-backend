import { Router } from 'express';
import * as adController from '../controllers/ad.controller.js';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import { aiPosterLimiter } from '../middleware/rateLimit.js';
import {
  adFeedQuerySchema,
  adIdParamSchema,
  createAdCampaignSchema,
  createExternalAdSchema,
  shopAdsQuerySchema,
  shopAdStatsQuerySchema,
  updateAdCampaignSchema,
  recordClickParamSchema,
  generatePosterSchema,
  detectObjectSchema,
  inpaintPosterSchema,
  regeneratePosterSchema,
  adminAdsQuerySchema,
  adminApproveAdSchema,
  adminPauseAdSchema,
  adminDeleteAdSchema,
} from '../validators/ad.schemas.js';

const router = Router();

// ─── CUSTOMER ─────────────────────────────────────────────────────────────────

router.get('/feed',
  protect,
  restrictTo('customer'),
  validate({ query: adFeedQuerySchema }),
  adController.getCustomerAdFeed
);

router.post('/:id/click',
  protect,
  restrictTo('customer'),
  validate({ params: adIdParamSchema }),
  adController.recordClick
);

// ─── EXTERNAL ─────────────────────────────────────────────────────────────────
// No auth — non-registered businesses submit ad requests publicly

router.post('/external/submit',
  validate({ body: createExternalAdSchema }),
  adController.submitExternalAd
);

// ─── AI POSTER ────────────────────────────────────────────────────────────────
// poster/* must come before /:id to avoid param conflict

router.post('/poster/generate',
  protect,
  restrictTo('shop'),
  aiPosterLimiter,
  validate({ body: generatePosterSchema }),
  adController.generatePoster
);

router.post('/poster/detect',
  protect,
  restrictTo('shop'),
  aiPosterLimiter,
  validate({ body: detectObjectSchema }),
  adController.detectObject
);

router.post('/poster/inpaint',
  protect,
  restrictTo('shop'),
  aiPosterLimiter,
  validate({ body: inpaintPosterSchema }),
  adController.inpaintPoster
);

router.post('/poster/regenerate',
  protect,
  restrictTo('shop'),
  aiPosterLimiter,
  validate({ body: regeneratePosterSchema }),
  adController.regeneratePoster
);

// ─── SHOP ─────────────────────────────────────────────────────────────────────

router.post('/',
  protect,
  restrictTo('shop'),
  validate({ body: createAdCampaignSchema }),
  adController.createAdCampaign
);

router.get('/me',
  protect,
  restrictTo('shop'),
  validate({ query: shopAdsQuerySchema }),
  adController.getShopAdCampaigns
);

router.get('/me/stats',
  protect,
  restrictTo('shop'),
  validate({ query: shopAdStatsQuerySchema }),
  adController.getShopAdStats
);

router.patch('/:id',
  protect,
  restrictTo('shop'),
  validate({ params: adIdParamSchema, body: updateAdCampaignSchema }),
  adController.updateAdCampaign
);

router.delete('/:id',
  protect,
  restrictTo('shop'),
  validate({ params: adIdParamSchema }),
  adController.deleteAdCampaign
);

// ─── ADMIN ────────────────────────────────────────────────────────────────────

router.get('/admin/all',
  protect,
  restrictTo('admin'),
  validate({ query: adminAdsQuerySchema }),
  adController.adminGetAllAds
);

router.patch('/admin/:id/approve',
  protect,
  restrictTo('admin'),
  validate({ params: adIdParamSchema, body: adminApproveAdSchema }),
  adController.adminApproveAd
);

router.patch('/admin/:id/pause',
  protect,
  restrictTo('admin'),
  validate({ params: adIdParamSchema, body: adminPauseAdSchema }),
  adController.adminPauseAd
);

router.delete('/admin/:id',
  protect,
  restrictTo('admin'),
  validate({ params: adIdParamSchema, body: adminDeleteAdSchema }),
  adController.adminDeleteAd
);

export default router;