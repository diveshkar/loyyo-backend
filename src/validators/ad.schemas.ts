import Joi from 'joi';
import { objectId, paginationQuery } from './common.schemas.js';

// ─── CUSTOMER ─────────────────────────────────────────────────────────────────

export const adFeedQuerySchema = Joi.object({
  ...paginationQuery,
});

export const adIdParamSchema = Joi.object({
  id: objectId.required(),
});

export const recordClickParamSchema = Joi.object({
  id: objectId.required(),
});

// ─── SHOP ─────────────────────────────────────────────────────────────────────

export const createAdCampaignSchema = Joi.object({
  title:         Joi.string().trim().min(2).max(160).required(),
  description:   Joi.string().trim().min(2).max(2000).required(),
  imageUrl:      Joi.string().uri(),
  adType:        Joi.string().valid('internal', 'boost', 'external').required(),
  weeklyBudget:  Joi.number().min(0).required(),
  startDate:     Joi.date().iso(),
  endDate:       Joi.date().iso().greater(Joi.ref('startDate')).required(),
  linkedOfferId: Joi.string().hex().length(24),
  externalContact: Joi.when('adType', {
    is:   'external',
    then: Joi.object({
      contactName:  Joi.string().trim().required(),
      contactPhone: Joi.string().trim().required(),
      contactEmail: Joi.string().email().required(),
      shopName:     Joi.string().trim().required(),
    }).required(),
    otherwise: Joi.forbidden(),
  }),
});

export const updateAdCampaignSchema = Joi.object({
  title:         Joi.string().trim().min(2).max(160),
  description:   Joi.string().trim().min(2).max(2000),
  imageUrl:      Joi.string().uri(),
  weeklyBudget:  Joi.number().min(0),
  startDate:     Joi.date().iso(),
  endDate:       Joi.date().iso(),
  isActive:      Joi.boolean(),
}).min(1);

export const shopAdsQuerySchema = Joi.object({
  ...paginationQuery,
  isActive: Joi.boolean(),
  adType:   Joi.string().valid('internal', 'boost', 'external'),
});

export const shopAdStatsQuerySchema = Joi.object({
  from: Joi.date().iso(),
  to:   Joi.date().iso().greater(Joi.ref('from')),
});

// ─── EXTERNAL ─────────────────────────────────────────────────────────────────

export const createExternalAdSchema = Joi.object({
  title:        Joi.string().trim().min(2).max(160).required(),
  description:  Joi.string().trim().min(2).max(2000).required(),
  imageUrl:     Joi.string().uri(),
  weeklyBudget: Joi.number().min(0).required(),
  startDate:    Joi.date().iso(),
  endDate:      Joi.date().iso().greater(Joi.ref('startDate')).required(),
  externalContact: Joi.object({
    contactName:  Joi.string().trim().required(),
    contactPhone: Joi.string().trim().required(),
    contactEmail: Joi.string().email().required(),
    shopName:     Joi.string().trim().required(),
  }).required(),
});

// ─── AI POSTER ────────────────────────────────────────────────────────────────

export const generatePosterSchema = Joi.object({
  shopName:     Joi.string().trim().min(1).max(100).required(),
  offerText:    Joi.string().trim().min(2).max(200).required(),
  tagline:      Joi.string().trim().min(2).max(150).required(),
  primaryColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).default('#2563EB'),
  style:        Joi.string().valid('modern', 'playful', 'elegant', 'bold').default('modern'),
});

export const detectObjectSchema = Joi.object({
  imageUrl: Joi.string().uri().required(),
  maskRegion: Joi.object({
    x:      Joi.number().min(0).required(),
    y:      Joi.number().min(0).required(),
    width:  Joi.number().min(1).required(),
    height: Joi.number().min(1).required(),
  }).required(),
});

export const inpaintPosterSchema = Joi.object({
  imageUrl: Joi.string().uri().required(),
  maskRegion: Joi.object({
    x:      Joi.number().min(0).required(),
    y:      Joi.number().min(0).required(),
    width:  Joi.number().min(1).required(),
    height: Joi.number().min(1).required(),
  }).required(),
  replaceWith: Joi.string().trim().min(1).max(200).required(),
  style:       Joi.string().valid('modern', 'playful', 'elegant', 'bold').default('modern'),
});

export const regeneratePosterSchema = Joi.object({
  originalPrompt: Joi.string().required(),
  updatedElements: Joi.object({
    background:  Joi.string(),
    font:        Joi.string(),
    colorScheme: Joi.string(),
    objects:     Joi.object().pattern(Joi.string(), Joi.string()),
  }).required(),
});

// ─── ADMIN ────────────────────────────────────────────────────────────────────

export const adminAdsQuerySchema = Joi.object({
  ...paginationQuery,
  isActive: Joi.boolean(),
  adType:   Joi.string().valid('internal', 'boost', 'external'),
});

export const adminApproveAdSchema = Joi.object({
  reason: Joi.string().trim().max(500),
});

export const adminPauseAdSchema = Joi.object({
  reason: Joi.string().trim().min(5).max(500).required(),
});

export const adminDeleteAdSchema = Joi.object({
  reason: Joi.string().trim().min(5).max(500).required(),
});