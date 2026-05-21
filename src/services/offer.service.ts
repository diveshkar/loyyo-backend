import type { IOffer } from '../models/Offer.js';
import type {
  CreateOfferInput,
  CustomerOffersInput,
  OfferWithShop,
  PaginatedResult,
  UpdateOfferInput,
} from './types.js';
import { notImplemented } from './notImplemented.js';

const serviceName = 'offer.service';

export const getCustomerOffers = async (
  _input: CustomerOffersInput
): Promise<PaginatedResult<OfferWithShop>> => {
  return notImplemented(serviceName, 'getCustomerOffers');
};

export const createOffer = async (_input: CreateOfferInput): Promise<IOffer> => {
  return notImplemented(serviceName, 'createOffer');
};

export const updateOffer = async (_input: UpdateOfferInput): Promise<IOffer> => {
  return notImplemented(serviceName, 'updateOffer');
};
