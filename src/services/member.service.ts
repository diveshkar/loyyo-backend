import type { IMembership } from '../models/Membership.js';
import type {
  CustomerMembershipInput,
  CustomerMembershipsInput,
  JoinShopInput,
  MembershipWithCustomer,
  MembershipWithShop,
  PaginatedResult,
  ShopMembersInput,
} from './types.js';
import { notImplemented } from './notImplemented.js';

const serviceName = 'member.service';

export const joinShop = async (_input: JoinShopInput): Promise<IMembership> => {
  return notImplemented(serviceName, 'joinShop');
};

export const getCustomerMemberships = async (
  _input: CustomerMembershipsInput
): Promise<PaginatedResult<MembershipWithShop>> => {
  return notImplemented(serviceName, 'getCustomerMemberships');
};

export const getCustomerMembership = async (
  _input: CustomerMembershipInput
): Promise<MembershipWithShop> => {
  return notImplemented(serviceName, 'getCustomerMembership');
};

export const getShopMembers = async (
  _input: ShopMembersInput
): Promise<PaginatedResult<MembershipWithCustomer>> => {
  return notImplemented(serviceName, 'getShopMembers');
};
