// import axios from 'axios';
// import { Types } from 'mongoose';
// import {
//   AdminAdsInput,
//   AdminApproveAdInput,
//   AdminDeleteAdInput,
//   AdminPauseAdInput,
//   AdWithShop,
//   CreateAdCampaignInput,
//   CustomerAdFeedInput,
//   DeleteAdCampaignInput,
//   DetectObjectInput,
//   DetectObjectResult,
//   EntityId,
//   GeneratePosterInput,
//   GeneratePosterResult,
//   InpaintPosterInput,
//   InpaintPosterResult,
//   PaginatedResult,
//   PosterStyle,
//   RecordClickInput,
//   RegeneratePosterInput,
//   RegeneratePosterResult,
//   ShopAdCampaignsInput,
//   ShopAdStatsInput,
//   ShopAdStatsResult,
//   SubmitExternalAdInput,
//   UpdateAdCampaignInput,
// } from './types.js';
// import { Shop } from '../models/Shop.js';
// import { Ad, IAd } from '../models/Ad.js';
// import { AuditLog } from '../models/AuditLog.js';
// import { Membership } from '../models/Membership.js';
// import { cloudinary } from '../config/cloudinary.js';
// import { InferenceClient } from '@huggingface/inference';

// // ─────────────────────────────────────────────────────────────────────────────
// // CONSTANTS
// // ─────────────────────────────────────────────────────────────────────────────

// const hfClient = new InferenceClient(process.env.HUGGING_FACE_API_KEY!);

// const HF_MODELS = {
//   generate: 'stabilityai/stable-diffusion-xl-base-1.0',
//   inpaint:  'stabilityai/stable-diffusion-2-inpainting',
//   detect:   'Salesforce/blip-image-captioning-base',
// } as const;

// const STYLE_GUIDE: Record<PosterStyle, string> = {
//   modern:   'clean minimalist design, sans-serif fonts, lots of whitespace, flat design',
//   playful:  'vibrant colors, rounded fonts, fun illustrations, energetic feel',
//   elegant:  'luxury aesthetic, serif fonts, dark rich colors, sophisticated layout',
//   bold:     'high contrast, large typography, strong colors, powerful visual impact',
// };

// const OBJECT_SUGGESTIONS: Record<string, string[]> = {
//   glass:   ['ceramic mug', 'tall bottle', 'tin can', 'paper cup'],
//   cup:     ['glass', 'ceramic mug', 'tall bottle', 'paper cup'],
//   mug:     ['glass', 'tall bottle', 'paper cup', 'tin can'],
//   bottle:  ['glass', 'ceramic mug', 'tin can', 'paper cup'],
//   plate:   ['bowl', 'tray', 'wooden board', 'basket'],
//   bowl:    ['plate', 'tray', 'wooden board', 'cup'],
//   bag:     ['box', 'pouch', 'basket', 'tray'],
//   cake:    ['cupcake', 'pastry', 'donut', 'pie'],
//   coffee:  ['tea', 'juice', 'smoothie', 'milkshake'],
//   default: ['version 1', 'version 2', 'version 3', 'version 4'],
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // HELPERS
// // ─────────────────────────────────────────────────────────────────────────────

// const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// const paginate = <T>(
//   items: T[],
//   total: number,
//   page: number,
//   limit: number
// ): PaginatedResult<T> => ({
//   items,
//   total,
//   page,
//   limit,
//   totalPages: Math.ceil(total / limit),
// });

// const resolveShopId = async (ownerId: EntityId): Promise<Types.ObjectId> => {
//   const shop = await Shop.findOne({
//     ownerId: new Types.ObjectId(ownerId.toString()),
//   }).select('_id').lean();

//   if (!shop) throw new Error('Shop not found for this owner');
//   return shop._id as Types.ObjectId;
// };

// const buildPrompt = (
//   shopName: string,
//   offerText: string,
//   tagline: string,
//   primaryColor: string,
//   style: PosterStyle,
//   extraContext = ''
// ): string =>
//   `Create a professional shop advertisement poster.
//    Shop name: "${shopName}". Main offer: "${offerText}".
//    Tagline: "${tagline}". Primary color: ${primaryColor}.
//    Design style: ${STYLE_GUIDE[style]}.
//    ${extraContext}
//    Requirements: mobile-friendly portrait format 4:5 ratio,
//    shop name at top, offer text large and clear in center,
//    tagline at bottom, no watermarks, high contrast, print ready.`
//     .replace(/\s+/g, ' ')
//     .trim();

// const extractMainObject = (caption: string): string => {
//   const lower = caption.toLowerCase();
//   const match = Object.keys(OBJECT_SUGGESTIONS).find(
//     (obj) => obj !== 'default' && lower.includes(obj)
//   );
//   return match ?? 'object';
// };

// const callHuggingFace = async (
//   model: string,
//   prompt: string,
//   retries = 3
// ): Promise<Buffer> => {
//   for (let i = 0; i < retries; i++) {
//     try {
//       console.log(`HF attempt ${i + 1} → ${model}`);

//       const result = await hfClient.textToImage({
//         model,
//         inputs: prompt,
//         parameters: {
//           num_inference_steps: 30,
//           guidance_scale:      7.5,
//         },
//       });

//       let arrayBuffer: ArrayBuffer;
//       if (typeof result === 'string') {
//         const res = await fetch(result);
//         arrayBuffer = await res.arrayBuffer();
//       } else {
//         arrayBuffer = await (result as Blob).arrayBuffer();
//       }

//       return Buffer.from(arrayBuffer);

//     } catch (err) {
//       console.log(`HF error attempt ${i + 1}:`, err);
//       if (i === retries - 1) throw err;
//       await sleep(3000);
//     }
//   }

//   throw new Error('Hugging Face failed after retries');
// };

// const uploadBufferToCloudinary = async (buffer: Buffer): Promise<string> => {
//   return new Promise((resolve, reject) => {
//     const stream = cloudinary.uploader.upload_stream(
//       { folder: 'loyyo/ads/ai-posters', resource_type: 'image' },
//       (error: any, result: any) => {
//         if (error || !result) return reject(error);
//         resolve(result.secure_url);
//       }
//     );
//     stream.end(buffer);
//   });
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // CUSTOMER
// // ─────────────────────────────────────────────────────────────────────────────

// export const getCustomerAdFeed = async (
//   input: CustomerAdFeedInput
// ): Promise<PaginatedResult<AdWithShop>> => {
//   const { customerId, page = 1, limit = 10 } = input;

//   const memberships = await Membership.find({ customerId }).select('shopId').lean();
//   const joinedShopIds = memberships.map((m) => m.shopId);

//   const now = new Date();

//   const [items, total] = await Promise.all([
//     Ad.aggregate([
//       {
//         $match: {
//           isActive:  true,
//           startDate: { $lte: now },
//           endDate:   { $gte: now },
//         },
//       },
//       {
//         $addFields: {
//           priority: {
//             $switch: {
//               branches: [
//                 {
//                   case: {
//                     $and: [
//                       { $eq: ['$adType', 'internal'] },
//                       { $not: { $in: ['$shopId', joinedShopIds] } },
//                     ],
//                   },
//                   then: 1,
//                 },
//                 { case: { $eq: ['$adType', 'boost'] },    then: 2 },
//                 { case: { $eq: ['$adType', 'external'] }, then: 3 },
//               ],
//               default: 4,
//             },
//           },
//         },
//       },
//       { $sort: { priority: 1, createdAt: -1 } },
//       { $skip: (page - 1) * limit },
//       { $limit: limit },
//       {
//         $lookup: {
//           from:         'shops',
//           localField:   'shopId',
//           foreignField: '_id',
//           as:           'shopId',
//         },
//       },
//       { $unwind: { path: '$shopId', preserveNullAndEmptyArrays: true } },
//     ]),
//     Ad.countDocuments({ isActive: true, startDate: { $lte: now }, endDate: { $gte: now } }),
//   ]);

//   await Ad.updateMany(
//     { _id: { $in: items.map((a) => a._id) } },
//     { $inc: { impressions: 1 } }
//   );

//   return paginate(items as unknown as AdWithShop[], total, page, limit);
// };

// export const recordClick = async (input: RecordClickInput): Promise<void> => {
//   await Ad.findByIdAndUpdate(input.adId, { $inc: { clicks: 1 } });
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // SHOP
// // ─────────────────────────────────────────────────────────────────────────────

// export const createAdCampaign = async (input: CreateAdCampaignInput): Promise<IAd> => {
//   const {
//     ownerId, title, description, imageUrl,
//     adType, weeklyBudget, startDate, endDate,
//     linkedOfferId, externalContact,
//   } = input;

//   // External ads skip shop resolution
//   const shopId = adType === 'external'
//     ? undefined
//     : await resolveShopId(ownerId!);

//   if (adType === 'boost') {
//     const shop = await Shop.findById(shopId).select('plan').lean();
//     if (!shop || shop.plan === 'free') {
//       throw new Error('Boost ads require an active paid plan');
//     }
//   }

//   const start = startDate ? new Date(startDate) : new Date();
//   if (start < new Date(Date.now() - 60_000)) {
//     throw new Error('startDate cannot be in the past');
//   }

//   const ad = await Ad.create({
//     shopId,
//     title,
//     description,
//     imageUrl,
//     adType,
//     weeklyBudget,
//     startDate:       start,
//     endDate:         new Date(endDate),
//     isActive:        true,
//     linkedOfferId:   linkedOfferId
//       ? new Types.ObjectId(linkedOfferId.toString())
//       : undefined,
//     externalContact: externalContact ?? undefined,
//   });

//   return ad;
// };

// export const getShopAdCampaigns = async (
//   input: ShopAdCampaignsInput
// ): Promise<PaginatedResult<IAd>> => {
//   const { ownerId, page = 1, limit = 10, isActive, adType } = input;

//   const shopId = await resolveShopId(ownerId);

//   const filter: Record<string, unknown> = { shopId };
//   if (isActive !== undefined) filter.isActive = isActive;
//   if (adType)                 filter.adType   = adType;

//   const [items, total] = await Promise.all([
//     Ad.find(filter)
//       .sort({ createdAt: -1 })
//       .skip((page - 1) * limit)
//       .limit(limit)
//       .lean(),
//     Ad.countDocuments(filter),
//   ]);

//   return paginate(items as IAd[], total, page, limit);
// };

// export const getShopAdStats = async (
//   input: ShopAdStatsInput
// ): Promise<ShopAdStatsResult> => {
//   const { ownerId, from, to } = input;
//   const shopId = await resolveShopId(ownerId);

//   const dateFilter: Record<string, Date> = {};
//   if (from) dateFilter.$gte = from;
//   if (to)   dateFilter.$lte = to;

//   const match: Record<string, unknown> = { shopId };
//   if (Object.keys(dateFilter).length) match.createdAt = dateFilter;

//   const [result] = await Ad.aggregate([
//     { $match: match },
//     {
//       $group: {
//         _id:              null,
//         totalImpressions: { $sum: '$impressions' },
//         totalClicks:      { $sum: '$clicks' },
//         totalSpend: {
//           $sum: {
//             $multiply: [
//               '$weeklyBudget',
//               {
//                 $divide: [
//                   { $subtract: ['$endDate', '$startDate'] },
//                   1000 * 60 * 60 * 24 * 7,
//                 ],
//               },
//             ],
//           },
//         },
//         activeCampaigns: {
//           $sum: { $cond: ['$isActive', 1, 0] },
//         },
//       },
//     },
//   ]);

//   return result ?? {
//     totalImpressions: 0,
//     totalClicks:      0,
//     totalSpend:       0,
//     activeCampaigns:  0,
//   };
// };

// export const updateAdCampaign = async (input: UpdateAdCampaignInput): Promise<IAd> => {
//   const { ownerId, adId, ...updates } = input;
//   const shopId = await resolveShopId(ownerId);

//   const ad = await Ad.findOneAndUpdate(
//     { _id: adId, shopId },
//     { $set: updates },
//     { new: true, runValidators: true }
//   );

//   if (!ad) throw new Error('Ad not found or unauthorized');
//   return ad;
// };

// export const deleteAdCampaign = async (input: DeleteAdCampaignInput): Promise<IAd> => {
//   const { ownerId, adId } = input;
//   const shopId = await resolveShopId(ownerId);

//   const ad = await Ad.findOneAndUpdate(
//     { _id: adId, shopId },
//     { $set: { isActive: false } },
//     { new: true }
//   );

//   if (!ad) throw new Error('Ad not found or unauthorized');
//   return ad;
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // EXTERNAL
// // ─────────────────────────────────────────────────────────────────────────────

// export const submitExternalAd = async (input: SubmitExternalAdInput): Promise<IAd> => {
//   const {
//     title, description, imageUrl,
//     weeklyBudget, startDate, endDate, externalContact,
//   } = input;

//   const ad = await Ad.create({
//     title,
//     description,
//     imageUrl,
//     adType:          'external',
//     weeklyBudget,
//     startDate:       startDate ? new Date(startDate) : new Date(),
//     endDate:         new Date(endDate),
//     isActive:        false,   // pending admin approval
//     externalContact,
//   });

//   return ad;
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // AI POSTER
// // ─────────────────────────────────────────────────────────────────────────────

// export const generatePoster = async (
//   input: GeneratePosterInput
// ): Promise<GeneratePosterResult> => {
//   const {
//     shopName,
//     offerText,
//     tagline,
//     primaryColor = '#2563EB',
//     style = 'modern',
//   } = input;

//   const prompt = buildPrompt(shopName, offerText, tagline, primaryColor, style);
//   const buffer = await callHuggingFace(HF_MODELS.generate, prompt);

//   console.log('Generated poster buffer size:', buffer.length);

//   const imageUrl = await uploadBufferToCloudinary(buffer);

//   return {
//     imageUrl,
//     prompt,
//     sessionData: {
//       shopName,
//       offerText,
//       tagline,
//       primaryColor,
//       style,
//       updatedElements: {},
//     },
//   };
// };

// export const detectObject = async (
//   input: DetectObjectInput
// ): Promise<DetectObjectResult> => {
//   const { imageUrl } = input;

//   const res = await axios.post(
//     `https://router.huggingface.co/hf-inference/models/${HF_MODELS.detect}`,
//     { inputs: imageUrl },
//     {
//       headers: {
//         Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
//       },
//       timeout: 30_000,
//     }
//   );

//   const data = res.data as Array<{ generated_text: string }>;
//   const caption = data[0]?.generated_text ?? '';

//   const detectedObject = extractMainObject(caption);
//   const suggestions = OBJECT_SUGGESTIONS[detectedObject] ?? OBJECT_SUGGESTIONS.default;

//   return { detectedObject, caption, suggestions };
// };

// export const inpaintPoster = async (
//   input: InpaintPosterInput
// ): Promise<InpaintPosterResult> => {
//   const { replaceWith, style = 'modern' } = input;

//   const prompt =
//     `${replaceWith}, professional product photography,
//      ${STYLE_GUIDE[style]}, high quality, realistic,
//      seamlessly integrated into the poster`
//       .replace(/\s+/g, ' ')
//       .trim();

//   const buffer   = await callHuggingFace(HF_MODELS.inpaint, prompt);
//   const imageUrl = await uploadBufferToCloudinary(buffer);

//   return { imageUrl };
// };

// export const regeneratePoster = async (
//   input: RegeneratePosterInput
// ): Promise<RegeneratePosterResult> => {
//   const { originalPrompt, updatedElements } = input;

//   let extraContext = '';
//   if (updatedElements.background)  extraContext += `Background: ${updatedElements.background}. `;
//   if (updatedElements.font)        extraContext += `Font style: ${updatedElements.font}. `;
//   if (updatedElements.colorScheme) extraContext += `Color scheme: ${updatedElements.colorScheme}. `;

//   if (updatedElements.objects) {
//     Object.entries(updatedElements.objects).forEach(([from, to]) => {
//       extraContext += `Replace ${from} with ${to}. `;
//     });
//   }

//   const updatedPrompt = `${originalPrompt} ${extraContext}`.trim();
//   const buffer        = await callHuggingFace(HF_MODELS.generate, updatedPrompt);
//   const imageUrl      = await uploadBufferToCloudinary(buffer);

//   return { imageUrl, prompt: updatedPrompt };
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // ADMIN
// // ─────────────────────────────────────────────────────────────────────────────

// export const adminGetAllAds = async (
//   input: AdminAdsInput
// ): Promise<PaginatedResult<AdWithShop>> => {
//   const { page = 1, limit = 20, isActive, adType } = input;

//   const filter: Record<string, unknown> = {};
//   if (isActive !== undefined) filter.isActive = isActive;
//   if (adType)                 filter.adType   = adType;

//   const [items, total] = await Promise.all([
//     Ad.find(filter)
//       .populate('shopId', 'name category address')
//       .sort({ createdAt: -1 })
//       .skip((page - 1) * limit)
//       .limit(limit)
//       .lean(),
//     Ad.countDocuments(filter),
//   ]);

//   return paginate(items as unknown as AdWithShop[], total, page, limit);
// };

// export const adminApproveAd = async (input: AdminApproveAdInput): Promise<IAd> => {
//   const { adminId, adId, reason } = input;

//   const ad = await Ad.findByIdAndUpdate(
//     adId,
//     { $set: { isActive: true } },
//     { new: true }
//   );
//   if (!ad) throw new Error('Ad not found');

//   await AuditLog.create({
//     adminId,
//     action:     'AD_APPROVED',
//     targetType: 'ad',
//     targetId:   adId,
//     before:     { isActive: false },
//     after:      { isActive: true },
//     reason,
//   });

//   return ad;
// };

// export const adminPauseAd = async (input: AdminPauseAdInput): Promise<IAd> => {
//   const { adminId, adId, reason } = input;

//   const ad = await Ad.findByIdAndUpdate(
//     adId,
//     { $set: { isActive: false } },
//     { new: true }
//   );
//   if (!ad) throw new Error('Ad not found');

//   await AuditLog.create({
//     adminId,
//     action:     'AD_PAUSED',
//     targetType: 'ad',
//     targetId:   adId,
//     before:     { isActive: true },
//     after:      { isActive: false },
//     reason,
//   });

//   return ad;
// };

// export const adminDeleteAd = async (input: AdminDeleteAdInput): Promise<void> => {
//   const { adminId, adId, reason } = input;

//   const ad = await Ad.findById(adId).lean();
//   if (!ad) throw new Error('Ad not found');

//   await Ad.findByIdAndUpdate(adId, { $set: { isActive: false } });

//   await AuditLog.create({
//     adminId,
//     action:     'AD_REMOVED',
//     targetType: 'ad',
//     targetId:   adId,
//     before:     { isActive: ad.isActive },
//     after:      { isActive: false },
//     reason,
//   });
// };

import axios from 'axios';
import OpenAI from 'openai';
import { Types } from 'mongoose';
import {
  AdminAdsInput,
  AdminApproveAdInput,
  AdminDeleteAdInput,
  AdminPauseAdInput,
  AdWithShop,
  CreateAdCampaignInput,
  CustomerAdFeedInput,
  DeleteAdCampaignInput,
  DetectObjectInput,
  DetectObjectResult,
  EntityId,
  GeneratePosterInput,
  GeneratePosterResult,
  InpaintPosterInput,
  InpaintPosterResult,
  PaginatedResult,
  PosterStyle,
  RecordClickInput,
  RegeneratePosterInput,
  RegeneratePosterResult,
  ShopAdCampaignsInput,
  ShopAdStatsInput,
  ShopAdStatsResult,
  SubmitExternalAdInput,
  UpdateAdCampaignInput,
} from './types.js';
import { Shop }       from '../models/Shop.js';
import { Ad, IAd }    from '../models/Ad.js';
import { AuditLog }   from '../models/AuditLog.js';
import { Membership } from '../models/Membership.js';
import { PosterUsage } from '../models/PosterUsage.js';
import { cloudinary } from '../config/cloudinary.js';
import { InferenceClient } from '@huggingface/inference';
import { AppError } from '../middleware/errorHandler.js';
import {
  assertPlanNotExpired,
  PLAN_AD_LIMITS,
  PLAN_AI_POSTER_ALLOWED,
  PLAN_AI_POSTER_MONTHLY_LIMITS,
} from './shop.service.js';

// ─────────────────────────────────────────────────────────────────────────────
// CLIENTS
// ─────────────────────────────────────────────────────────────────────────────

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const hfClient = new InferenceClient(process.env.HUGGING_FACE_API_KEY!);

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const HF_MODELS = {
  inpaint: 'stabilityai/stable-diffusion-2-inpainting',
  detect:  'Salesforce/blip-image-captioning-base',
} as const;

const STYLE_GUIDE: Record<PosterStyle, string> = {
  modern:   'clean minimalist design, sans-serif fonts, lots of whitespace, flat design',
  playful:  'vibrant colors, rounded fonts, fun illustrations, energetic feel',
  elegant:  'luxury aesthetic, serif fonts, dark rich colors, sophisticated layout',
  bold:     'high contrast, large typography, strong colors, powerful visual impact',
};

const OBJECT_SUGGESTIONS: Record<string, string[]> = {
  glass:   ['ceramic mug', 'tall bottle', 'tin can', 'paper cup'],
  cup:     ['glass', 'ceramic mug', 'tall bottle', 'paper cup'],
  mug:     ['glass', 'tall bottle', 'paper cup', 'tin can'],
  bottle:  ['glass', 'ceramic mug', 'tin can', 'paper cup'],
  plate:   ['bowl', 'tray', 'wooden board', 'basket'],
  bowl:    ['plate', 'tray', 'wooden board', 'cup'],
  bag:     ['box', 'pouch', 'basket', 'tray'],
  cake:    ['cupcake', 'pastry', 'donut', 'pie'],
  coffee:  ['tea', 'juice', 'smoothie', 'milkshake'],
  default: ['version 1', 'version 2', 'version 3', 'version 4'],
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const paginate = <T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> => ({
  items,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});

const resolveShopId = async (ownerId: EntityId): Promise<Types.ObjectId> => {
  const shop = await Shop.findOne({
    ownerId: new Types.ObjectId(ownerId.toString()),
  }).select('_id').lean();

  if (!shop) throw new Error('Shop not found for this owner');
  return shop._id as Types.ObjectId;
};

/**
 * Translate any text (Sinhala, Tamil, Thanglish, or English)
 * to clean English using GPT-4o-mini before sending to image model
 */
const translateToEnglish = async (text: string): Promise<string> => {
  if (!text?.trim()) return text;

  try {
    const response = await openai.chat.completions.create({
      model:      'gpt-4o-mini',
      max_tokens: 300,
      messages: [{
        role:    'user',
        content: `Translate this text to English.
                  It may be Sinhala, Tamil, Thanglish (Tamil written in English letters), or already English.
                  If it is already English return it exactly as is.
                  Return ONLY the translated text — no explanations, no quotes, nothing else.
                  Text: "${text}"`,
      }],
    });

    return response.choices[0]?.message?.content?.trim() ?? text;

  } catch (err) {
    console.log('Translation failed — using original text:', err);
    return text; // fallback to original if translation fails
  }
};

/**
 * Build the image generation prompt from translated inputs
 * Structured for GPT Image 1.5 / gpt-image-1 prompt adherence
 */
const buildPrompt = (
  shopName: string,
  offerText: string,
  tagline: string,
  primaryColor: string,
  style: PosterStyle,
  extraContext = ''
): string => {
  return `
    You are designing a professional advertisement poster for a shop.

    SHOP DETAILS:
    - Shop name: "${shopName}"
    - Main offer: "${offerText}"
    - Tagline: "${tagline}"
    - Brand color: ${primaryColor}

    DESIGN STYLE: ${STYLE_GUIDE[style]}

    LAYOUT REQUIREMENTS:
    - Portrait format (2:3 ratio) optimized for mobile screens
    - Shop name bold and prominent at the top
    - Main offer text large and eye-catching in the center
    - Tagline smaller text at the bottom
    - Use the brand color as the primary accent color
    - Clean professional background that complements the brand color
    - High contrast between text and background
    - No watermarks, no borders, print-ready quality
    - All text must be clearly readable

    ${extraContext ? `ADDITIONAL REQUIREMENTS: ${extraContext}` : ''}
  `.replace(/\s+/g, ' ').trim();
};

/**
 * Generate poster image using GPT Image 1.5 (gpt-image-1)
 * Returns buffer ready for Cloudinary upload
 */
const callOpenAI = async (prompt: string): Promise<Buffer> => {
  const response = await openai.images.generate({
    model:   'gpt-image-1',   // GPT Image 1.5
    prompt,
    n:       1,
    size:    '1024x1536',     // portrait 2:3 — perfect for ad posters
    quality: 'medium',        // $0.034/image — good balance for MVP
  });

  const imageUrl = response.data?.[0]?.url;
  if (!imageUrl) throw new Error('No image returned from OpenAI');

  // Download image and convert to buffer for Cloudinary
  const res = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  return Buffer.from(res.data);
};

/**
 * Generate or detect using Hugging Face
 * Used for inpainting and object detection only
 */
const callHuggingFace = async (
  model: string,
  prompt: string,
  retries = 3
): Promise<Buffer> => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`HF attempt ${i + 1} → ${model}`);

      const result = await hfClient.textToImage({
        model,
        inputs: prompt,
        parameters: {
          num_inference_steps: 30,
          guidance_scale:      7.5,
        },
      });

      let arrayBuffer: ArrayBuffer;
      if (typeof result === 'string') {
        const res  = await fetch(result);
        arrayBuffer = await res.arrayBuffer();
      } else {
        arrayBuffer = await (result as Blob).arrayBuffer();
      }

      return Buffer.from(arrayBuffer);

    } catch (err) {
      console.log(`HF error attempt ${i + 1}:`, err);
      if (i === retries - 1) throw err;
      await sleep(3000);
    }
  }

  throw new Error('Hugging Face failed after retries');
};

const uploadBufferToCloudinary = async (buffer: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'loyyo/ads/ai-posters', resource_type: 'image' },
      (error: any, result: any) => {
        if (error || !result) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};

const extractMainObject = (caption: string): string => {
  const lower = caption.toLowerCase();
  const match = Object.keys(OBJECT_SUGGESTIONS).find(
    (obj) => obj !== 'default' && lower.includes(obj)
  );
  return match ?? 'object';
};

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER
// ─────────────────────────────────────────────────────────────────────────────

export const getCustomerAdFeed = async (
  input: CustomerAdFeedInput
): Promise<PaginatedResult<AdWithShop>> => {
  const { customerId, page = 1, limit = 10 } = input;

  const memberships  = await Membership.find({ customerId }).select('shopId').lean();
  const joinedShopIds = memberships.map((m) => m.shopId);

  const now = new Date();

  const [items, total] = await Promise.all([
    Ad.aggregate([
      {
        $match: {
          isActive:  true,
          startDate: { $lte: now },
          endDate:   { $gte: now },
        },
      },
      {
        $addFields: {
          priority: {
            $switch: {
              branches: [
                {
                  case: {
                    $and: [
                      { $eq: ['$adType', 'internal'] },
                      { $not: { $in: ['$shopId', joinedShopIds] } },
                    ],
                  },
                  then: 1,
                },
                { case: { $eq: ['$adType', 'boost'] },    then: 2 },
                { case: { $eq: ['$adType', 'external'] }, then: 3 },
              ],
              default: 4,
            },
          },
        },
      },
      { $sort: { priority: 1, createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from:         'shops',
          localField:   'shopId',
          foreignField: '_id',
          as:           'shopId',
        },
      },
      { $unwind: { path: '$shopId', preserveNullAndEmptyArrays: true } },
    ]),
    Ad.countDocuments({
      isActive:  true,
      startDate: { $lte: now },
      endDate:   { $gte: now },
    }),
  ]);

  await Ad.updateMany(
    { _id: { $in: items.map((a) => a._id) } },
    { $inc: { impressions: 1 } }
  );

  return paginate(items as unknown as AdWithShop[], total, page, limit);
};

export const recordClick = async (input: RecordClickInput): Promise<void> => {
  await Ad.findByIdAndUpdate(input.adId, { $inc: { clicks: 1 } });
};

// ─────────────────────────────────────────────────────────────────────────────
// SHOP
// ─────────────────────────────────────────────────────────────────────────────

export const createAdCampaign = async (input: CreateAdCampaignInput): Promise<IAd> => {
  const {
    ownerId, title, description, imageUrl,
    adType, weeklyBudget, startDate, endDate,
    linkedOfferId, externalContact,
  } = input;

  const shopId = adType === 'external'
    ? undefined
    : await resolveShopId(ownerId!);

  if (shopId) {
    const shop = await Shop.findById(shopId).select('plan planExpiresAt').lean();
    if (!shop) throw new AppError('Shop not found', 404);

    // plan expiry check
    assertPlanNotExpired(shop);

    // ad campaign limit check
    const adLimit = PLAN_AD_LIMITS[shop.plan];
    if (adLimit !== null) {
      if (adLimit === 0) {
        throw new AppError(
          `Your ${shop.plan} plan does not include ad campaigns. Upgrade to Basic or above.`,
          403
        );
      }
      const activeAds = await Ad.countDocuments({ shopId, isActive: true });
      if (activeAds >= adLimit) {
        throw new AppError(
          `Your ${shop.plan} plan allows a maximum of ${adLimit} active ad campaign${adLimit === 1 ? '' : 's'}. Upgrade to add more.`,
          403
        );
      }
    }
  }

  const start = startDate ? new Date(startDate) : new Date();
  if (start < new Date(Date.now() - 60_000)) {
    throw new Error('startDate cannot be in the past');
  }

  const ad = await Ad.create({
    shopId,
    title,
    description,
    imageUrl,
    adType,
    weeklyBudget,
    startDate:       start,
    endDate:         new Date(endDate),
    isActive:        true,
    linkedOfferId:   linkedOfferId
      ? new Types.ObjectId(linkedOfferId.toString())
      : undefined,
    externalContact: externalContact ?? undefined,
  });

  return ad;
};

export const getShopAdCampaigns = async (
  input: ShopAdCampaignsInput
): Promise<PaginatedResult<IAd>> => {
  const { ownerId, page = 1, limit = 10, isActive, adType } = input;

  const shopId = await resolveShopId(ownerId);

  const filter: Record<string, unknown> = { shopId };
  if (isActive !== undefined) filter.isActive = isActive;
  if (adType)                 filter.adType   = adType;

  const [items, total] = await Promise.all([
    Ad.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Ad.countDocuments(filter),
  ]);

  return paginate(items as IAd[], total, page, limit);
};

export const getShopAdStats = async (
  input: ShopAdStatsInput
): Promise<ShopAdStatsResult> => {
  const { ownerId, from, to } = input;
  const shopId = await resolveShopId(ownerId);

  const dateFilter: Record<string, Date> = {};
  if (from) dateFilter.$gte = from;
  if (to)   dateFilter.$lte = to;

  const match: Record<string, unknown> = { shopId };
  if (Object.keys(dateFilter).length) match.createdAt = dateFilter;

  const [result] = await Ad.aggregate([
    { $match: match },
    {
      $group: {
        _id:              null,
        totalImpressions: { $sum: '$impressions' },
        totalClicks:      { $sum: '$clicks' },
        totalSpend: {
          $sum: {
            $multiply: [
              '$weeklyBudget',
              {
                $divide: [
                  { $subtract: ['$endDate', '$startDate'] },
                  1000 * 60 * 60 * 24 * 7,
                ],
              },
            ],
          },
        },
        activeCampaigns: {
          $sum: { $cond: ['$isActive', 1, 0] },
        },
      },
    },
  ]);

  return result ?? {
    totalImpressions: 0,
    totalClicks:      0,
    totalSpend:       0,
    activeCampaigns:  0,
  };
};

export const updateAdCampaign = async (input: UpdateAdCampaignInput): Promise<IAd> => {
  const { ownerId, adId, ...updates } = input;
  const shopId = await resolveShopId(ownerId);

  const ad = await Ad.findOneAndUpdate(
    { _id: adId, shopId },
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!ad) throw new Error('Ad not found or unauthorized');
  return ad;
};

export const deleteAdCampaign = async (input: DeleteAdCampaignInput): Promise<IAd> => {
  const { ownerId, adId } = input;
  const shopId = await resolveShopId(ownerId);

  const ad = await Ad.findOneAndUpdate(
    { _id: adId, shopId },
    { $set: { isActive: false } },
    { new: true }
  );

  if (!ad) throw new Error('Ad not found or unauthorized');
  return ad;
};

// ─────────────────────────────────────────────────────────────────────────────
// EXTERNAL
// ─────────────────────────────────────────────────────────────────────────────

export const submitExternalAd = async (input: SubmitExternalAdInput): Promise<IAd> => {
  const {
    title, description, imageUrl,
    weeklyBudget, startDate, endDate, externalContact,
  } = input;

  const ad = await Ad.create({
    title,
    description,
    imageUrl,
    adType:          'external',
    weeklyBudget,
    startDate:       startDate ? new Date(startDate) : new Date(),
    endDate:         new Date(endDate),
    isActive:        false,  // pending admin approval
    externalContact,
  });

  return ad;
};

// ─────────────────────────────────────────────────────────────────────────────
// AI POSTER
// ─────────────────────────────────────────────────────────────────────────────

export const generatePoster = async (
  input: GeneratePosterInput
): Promise<GeneratePosterResult> => {
  const {
    ownerId,
    shopName,
    offerText,
    tagline,
    primaryColor = '#2563EB',
    style        = 'modern',
    extraContext,
  } = input;

  // plan check + monthly usage limit
  const shop = await Shop.findOne({
    ownerId: new Types.ObjectId(ownerId.toString()),
  }).select('_id plan planExpiresAt').lean();

  if (!shop) throw new AppError('Shop not found', 404);

  assertPlanNotExpired(shop);

  if (!PLAN_AI_POSTER_ALLOWED.has(shop.plan)) {
    throw new AppError(
      `AI poster generation requires the Basic plan or above. Your current plan is ${shop.plan}.`,
      403
    );
  }

  const monthlyLimit = PLAN_AI_POSTER_MONTHLY_LIMITS[shop.plan];
  if (monthlyLimit !== null) {
    const yearMonth = new Date().toISOString().slice(0, 7); // "2026-05"
    const usage = await PosterUsage.findOne({
      shopId: shop._id,
      yearMonth,
    }).lean();

    const used = usage?.count ?? 0;
    if (used >= monthlyLimit) {
      throw new AppError(
        `You have used all ${monthlyLimit} AI poster generation${monthlyLimit === 1 ? '' : 's'} for this month. Resets on the 1st of next month or upgrade your plan for more.`,
        429
      );
    }
  }

  // Translate all inputs to English in parallel
  // Handles Sinhala, Tamil, Thanglish, or already English
  const [
    translatedShopName,
    translatedOfferText,
    translatedTagline,
    translatedExtraContext,
  ] = await Promise.all([
    translateToEnglish(shopName),
    translateToEnglish(offerText),
    translateToEnglish(tagline),
    extraContext ? translateToEnglish(extraContext) : Promise.resolve(''),
  ]);

  const prompt = buildPrompt(
    translatedShopName,
    translatedOfferText,
    translatedTagline,
    primaryColor,
    style,
    translatedExtraContext
  );

  console.log('Generating poster with GPT Image 1.5...');
  const buffer   = await callOpenAI(prompt);
  const imageUrl = await uploadBufferToCloudinary(buffer);

  // increment monthly usage counter after successful generation
  const yearMonth = new Date().toISOString().slice(0, 7);
  await PosterUsage.findOneAndUpdate(
    { shopId: shop._id, yearMonth },
    { $inc: { count: 1 } },
    { upsert: true, new: true }
  );

  return {
    imageUrl,
    prompt,
    sessionData: {
      shopName,     // keep originals for UI display
      offerText,
      tagline,
      primaryColor,
      style,
      updatedElements: {},
    },
  };
};

export const detectObject = async (
  input: DetectObjectInput
): Promise<DetectObjectResult> => {
  const { imageUrl } = input;

  const res = await axios.post(
    `https://router.huggingface.co/hf-inference/models/${HF_MODELS.detect}`,
    { inputs: imageUrl },
    {
      headers: {
        Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
      },
      timeout: 30_000,
    }
  );

  const data           = res.data as Array<{ generated_text: string }>;
  const caption        = data[0]?.generated_text ?? '';
  const detectedObject = extractMainObject(caption);
  const suggestions    = OBJECT_SUGGESTIONS[detectedObject] ?? OBJECT_SUGGESTIONS.default;

  return { detectedObject, caption, suggestions };
};

export const inpaintPoster = async (
  input: InpaintPosterInput
): Promise<InpaintPosterResult> => {
  const { replaceWith, style = 'modern' } = input;

  const prompt =
    `${replaceWith}, professional product photography,
     ${STYLE_GUIDE[style]}, high quality, realistic,
     seamlessly integrated into the poster`
      .replace(/\s+/g, ' ')
      .trim();

  const buffer   = await callHuggingFace(HF_MODELS.inpaint, prompt);
  const imageUrl = await uploadBufferToCloudinary(buffer);

  return { imageUrl };
};

export const regeneratePoster = async (
  input: RegeneratePosterInput
): Promise<RegeneratePosterResult> => {
  const { originalPrompt, updatedElements } = input;

  let extraContext = '';
  if (updatedElements.background)  extraContext += `Background: ${updatedElements.background}. `;
  if (updatedElements.font)        extraContext += `Font style: ${updatedElements.font}. `;
  if (updatedElements.colorScheme) extraContext += `Color scheme: ${updatedElements.colorScheme}. `;

  if (updatedElements.objects) {
    Object.entries(updatedElements.objects).forEach(([from, to]) => {
      extraContext += `Replace ${from} with ${to}. `;
    });
  }

  // Translate extraContext in case user typed in Thanglish
  const translatedExtra = await translateToEnglish(extraContext);
  const updatedPrompt   = `${originalPrompt} ${translatedExtra}`.trim();

  console.log('Regenerating poster with GPT Image 1.5...');
  const buffer   = await callOpenAI(updatedPrompt);
  const imageUrl = await uploadBufferToCloudinary(buffer);

  return { imageUrl, prompt: updatedPrompt };
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────────────────────────────────────

export const adminGetAllAds = async (
  input: AdminAdsInput
): Promise<PaginatedResult<AdWithShop>> => {
  const { page = 1, limit = 20, isActive, adType } = input;

  const filter: Record<string, unknown> = {};
  if (isActive !== undefined) filter.isActive = isActive;
  if (adType)                 filter.adType   = adType;

  const [items, total] = await Promise.all([
    Ad.find(filter)
      .populate('shopId', 'name category address')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Ad.countDocuments(filter),
  ]);

  return paginate(items as unknown as AdWithShop[], total, page, limit);
};

export const adminApproveAd = async (input: AdminApproveAdInput): Promise<IAd> => {
  const { adminId, adId, reason } = input;

  const ad = await Ad.findByIdAndUpdate(
    adId,
    { $set: { isActive: true } },
    { new: true }
  );
  if (!ad) throw new Error('Ad not found');

  await AuditLog.create({
    adminId,
    action:     'AD_APPROVED',
    targetType: 'ad',
    targetId:   adId,
    before:     { isActive: false },
    after:      { isActive: true },
    reason,
  });

  return ad;
};

export const adminPauseAd = async (input: AdminPauseAdInput): Promise<IAd> => {
  const { adminId, adId, reason } = input;

  const ad = await Ad.findByIdAndUpdate(
    adId,
    { $set: { isActive: false } },
    { new: true }
  );
  if (!ad) throw new Error('Ad not found');

  await AuditLog.create({
    adminId,
    action:     'AD_PAUSED',
    targetType: 'ad',
    targetId:   adId,
    before:     { isActive: true },
    after:      { isActive: false },
    reason,
  });

  return ad;
};

export const adminDeleteAd = async (input: AdminDeleteAdInput): Promise<void> => {
  const { adminId, adId, reason } = input;

  const ad = await Ad.findById(adId).lean();
  if (!ad) throw new Error('Ad not found');

  await Ad.findByIdAndUpdate(adId, { $set: { isActive: false } });

  await AuditLog.create({
    adminId,
    action:     'AD_REMOVED',
    targetType: 'ad',
    targetId:   adId,
    before:     { isActive: ad.isActive },
    after:      { isActive: false },
    reason,
  });
};