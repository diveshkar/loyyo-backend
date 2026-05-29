import { Types } from 'mongoose';
import { AppError } from '../middleware/errorHandler.js';
import { Ad } from '../models/Ad.js';
import { Membership } from '../models/Membership.js';
import { Offer, type IOffer } from '../models/Offer.js';
import { Shop } from '../models/Shop.js';
import type {
  BoostOfferAsAdInput,
  CreateOfferInput,
  CustomerOffersInput,
  DeleteOfferInput,
  GetOfferByIdInput,
  GetShopOfferByIdInput,
  GetShopOffersInput,
  OfferWithShop,
  PaginatedResult,
  UpdateOfferInput,
} from './types.js';
import { IAd } from '../models/Ad.js';

const paginate = <T>(items: T[], total: number, page = 1, limit = 20): PaginatedResult<T> => ({
  items,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});

const toObjectId = (id: string | Types.ObjectId): Types.ObjectId =>
  new Types.ObjectId(id.toString());

const resolveShopId = async (ownerId: string | Types.ObjectId): Promise<Types.ObjectId> => {
  const shop = await Shop.findOne({ ownerId: toObjectId(ownerId) }).select('_id').lean();
  if (!shop) throw new AppError('Shop not found for this owner', 404);
  return shop._id as Types.ObjectId;
};

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER
// ─────────────────────────────────────────────────────────────────────────────

export const getCustomerOffers = async (
  input: CustomerOffersInput
): Promise<PaginatedResult<OfferWithShop>> => {
  const page  = input.page ?? 1;
  const limit = input.limit ?? 20;

  const memberships = await Membership.find({
    customerId: toObjectId(input.customerId),
    isActive:   true,
  }).select('shopId').lean();

  const shopIds = memberships.map((m) => m.shopId);

  const filter = {
    shopId:    { $in: shopIds },
    isActive:  true,
    startDate: { $lte: new Date() },
    endDate:   { $gte: new Date() },
  };

  const [items, total] = await Promise.all([
    Offer.find(filter)
      .populate('shopId', 'name type businessType address logoUrl')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Offer.countDocuments(filter),
  ]);

  return paginate(items as unknown as OfferWithShop[], total, page, limit);
};

export const getOfferById = async (input: GetOfferByIdInput): Promise<OfferWithShop> => {
  const offer = await Offer.findById(toObjectId(input.offerId))
    .populate('shopId', 'name type businessType address logoUrl')
    .lean();

  if (!offer)            throw new AppError('Offer not found', 404);
  if (!offer.isActive)   throw new AppError('This offer is no longer active', 410);

  return offer as unknown as OfferWithShop;
};

// ─────────────────────────────────────────────────────────────────────────────
// SHOP
// ─────────────────────────────────────────────────────────────────────────────

export const getShopOffers = async (
  input: GetShopOffersInput
): Promise<PaginatedResult<IOffer>> => {
  const page   = input.page ?? 1;
  const limit  = input.limit ?? 20;
  const shopId = await resolveShopId(input.ownerId);

  const filter: Record<string, unknown> = { shopId };
  if (typeof input.isActive === 'boolean') filter.isActive = input.isActive;

  const [items, total] = await Promise.all([
    Offer.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Offer.countDocuments(filter),
  ]);

  return paginate(items as IOffer[], total, page, limit);
};

export const getShopOfferById = async (input: GetShopOfferByIdInput): Promise<IOffer> => {
  const shopId = await resolveShopId(input.ownerId);
  const offer  = await Offer.findOne({
    _id:    toObjectId(input.offerId),
    shopId,
  }).lean();

  if (!offer) throw new AppError('Offer not found', 404);
  return offer as IOffer;
};

export const createOffer = async (input: CreateOfferInput): Promise<IOffer> => {
  const shopId = await resolveShopId(input.ownerId);

  return Offer.create({
    shopId,
    title:         input.title,
    description:   input.description,
    imageUrl:      input.imageUrl,
    discountType:  input.discountType,
    discountValue: input.discountValue,
    startDate:     input.startDate,
    endDate:       input.endDate,
    expiresAt:     input.expiresAt ?? input.endDate,
    isActive:      true,
  });
};

export const updateOffer = async (input: UpdateOfferInput): Promise<IOffer> => {
  const shopId              = await resolveShopId(input.ownerId);
  const { ownerId: _o, offerId, ...updates } = input;

  const offer = await Offer.findOneAndUpdate(
    { _id: toObjectId(offerId), shopId },
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!offer) throw new AppError('Offer not found', 404);
  return offer;
};

export const deleteOffer = async (input: DeleteOfferInput): Promise<void> => {
  const shopId = await resolveShopId(input.ownerId);

  const offer = await Offer.findOneAndUpdate(
    { _id: toObjectId(input.offerId), shopId },
    { $set: { isActive: false } },
    { new: true }
  );

  if (!offer) throw new AppError('Offer not found', 404);
};

export const boostOfferAsAd = async (input: BoostOfferAsAdInput): Promise<IAd> => {
  const shopId = await resolveShopId(input.ownerId);

  const offer = await Offer.findOne({
    _id:      toObjectId(input.offerId),
    shopId,
    isActive: true,
  }).lean();

  if (!offer) throw new AppError('Active offer not found', 404);

  // check if already boosted and still active
  const existingBoost = await Ad.findOne({
    linkedOfferId: offer._id,
    shopId,
    adType:        'boost',
    isActive:      true,
  }).lean();

  if (existingBoost) throw new AppError('This offer is already being boosted', 409);

  const ad = await Ad.create({
    shopId,
    title:         offer.title,
    description:   offer.description,
    imageUrl:      offer.imageUrl,
    adType:        'boost',
    weeklyBudget:  input.weeklyBudget,
    startDate:     input.startDate ?? new Date(),
    endDate:       input.endDate,
    linkedOfferId: offer._id,
    isActive:      false, // pending admin approval
    impressions:   0,
    clicks:        0,
  });

  return ad;
};