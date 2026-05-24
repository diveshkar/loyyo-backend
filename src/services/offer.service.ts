import { Types } from 'mongoose';
import { AppError } from '../middleware/errorHandler.js';
import { Membership } from '../models/Membership.js';
import { Offer, type IOffer } from '../models/Offer.js';
import { Shop } from '../models/Shop.js';
import type {
  CreateOfferInput,
  CustomerOffersInput,
  OfferWithShop,
  PaginatedResult,
  UpdateOfferInput,
} from './types.js';

const paginate = <T>(items: T[], total: number, page = 1, limit = 20): PaginatedResult<T> => ({
  items,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});

const resolveShopId = async (ownerId: Types.ObjectId | string): Promise<Types.ObjectId> => {
  const shop = await Shop.findOne({ ownerId: new Types.ObjectId(ownerId.toString()) }).select('_id').lean();
  if (!shop) throw new AppError('Shop not found for this owner', 404);
  return shop._id as Types.ObjectId;
};

export const getCustomerOffers = async (
  input: CustomerOffersInput
): Promise<PaginatedResult<OfferWithShop>> => {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;
  const memberships = await Membership.find({
    customerId: new Types.ObjectId(input.customerId.toString()),
    isActive: true,
  }).select('shopId').lean();

  const shopIds = memberships.map((membership) => membership.shopId);
  const filter = {
    shopId: { $in: shopIds },
    isActive: true,
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
  };

  const [items, total] = await Promise.all([
    Offer.find(filter)
      .populate('shopId', 'name type address')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Offer.countDocuments(filter),
  ]);

  return paginate(items as unknown as OfferWithShop[], total, page, limit);
};

export const createOffer = async (input: CreateOfferInput): Promise<IOffer> => {
  const shopId = await resolveShopId(input.ownerId.toString());
  return Offer.create({
    shopId,
    title: input.title,
    description: input.description,
    imageUrl: input.imageUrl,
    discountType: input.discountType,
    discountValue: input.discountValue,
    startDate: input.startDate,
    endDate: input.endDate,
    expiresAt: input.expiresAt ?? input.endDate,
    isActive: true,
  });
};

export const updateOffer = async (input: UpdateOfferInput): Promise<IOffer> => {
  const shopId = await resolveShopId(input.ownerId.toString());
  const { ownerId: _ownerId, offerId, ...updates } = input;
  const offer = await Offer.findOneAndUpdate(
    { _id: new Types.ObjectId(offerId.toString()), shopId },
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!offer) throw new AppError('Offer not found', 404);
  return offer;
};
