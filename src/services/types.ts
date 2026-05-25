import type { Types }    from 'mongoose';
import { IAd }           from '../models/Ad.js';
import { IAuditLog }     from '../models/AuditLog.js';
import { IShop }         from '../models/Shop.js';
import { IUser }         from '../models/User.js';
import { IMembership }   from '../models/Membership.js';
import { IVisit }        from '../models/Visit.js';
import { IOffer }        from '../models/Offer.js';
import { IPayment }      from '../models/Payment.js';
import { ILoyaltyRule }  from '../models/LoyaltyRule.js';
import { IPointsLedger } from '../models/PointsLedger.js';
import { INotification } from '../models/Notification.js';
import { IReferral }     from '../models/Referral.js';
import { ICheckinToken } from '../models/CheckinToken.js';
import type { UsedByDevice } from '../models/enums.js';

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

export type EntityId       = string | Types.ObjectId;
export type UserRole       = 'customer' | 'shop' | 'admin';
export type ShopPlan       = 'free' | 'basic' | 'standard' | 'premium';
export type ShopStatus     = 'pending' | 'active' | 'suspended';
export type ShopType       =
  | 'tea_shop' | 'salon'       | 'restaurant'
  | 'supermarket' | 'clothing' | 'electronics'
  | 'gym' | 'pharmacy'         | 'grocery'
  | 'bakery' | 'other';
export type PaymentPlan    = 'basic' | 'standard' | 'premium';
export type PaymentStatus  = 'pending' | 'paid' | 'failed' | 'refunded';
export type AdType         = 'internal' | 'boost' | 'external';
export type PosterStyle    = 'modern' | 'playful' | 'elegant' | 'bold';
export type LoyaltyType    = 'visit' | 'points' | 'spend' | 'product' | 'hybrid' | 'tier' | 'referral' | 'event';
export type RewardType     = 'free_item' | 'percent_discount' | 'fixed_discount' | 'cashback' | 'voucher' | 'buy_x_get_y';
export type DiscountType   = 'percent' | 'free_item' | 'fixed' | 'cashback';
export type MarkedByMethod = 'qr_scan' | 'barcode_scan' | 'kiosk' | 'plugin' | 'manual';

// ─────────────────────────────────────────────────────────────────────────────
// SHARED
// ─────────────────────────────────────────────────────────────────────────────

export interface PaginationInput {
  page?:  number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items:      T[];
  page:       number;
  limit:      number;
  total:      number;
  totalPages: number;
}

export interface MaskRegion {
  x:      number;
  y:      number;
  width:  number;
  height: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken:  string;
  refreshToken: string;
  expiresIn:    string;
}

export interface AuthResult {
  user:   IUser;
  tokens: AuthTokens;
}

export interface RegisterCustomerInput {
  name:     string;
  email:    string;
  password: string;
  phone?:   string;
}

export interface LoginInput {
  email:    string;
  password: string;
}

export interface RegisterShopInput {
  ownerName:   string;
  ownerEmail:  string;
  password:    string;
  phone?:      string;
  shopName:    string;
  description: string;
  type?:       ShopType;
  category?:   string;
  address:     string;
  longitude:   number;
  latitude:    number;
  logoUrl?:    string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface LogoutInput {
  userId:        EntityId;
  refreshToken?: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token:       string;
  newPassword: string;
}

export interface ChangePasswordInput {
  userId:      EntityId;
  oldPassword: string;
  newPassword: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SHOP
// ─────────────────────────────────────────────────────────────────────────────

export interface CurrentShopInput {
  ownerId: EntityId;
}

export interface UpdateShopProfileInput extends CurrentShopInput {
  name?:        string;
  description?: string;
  type?:        ShopType;
  category?:    string;
  logoUrl?:     string;
  address?:     string;
  longitude?:   number;
  latitude?:    number;
}

export interface PublicShopInput {
  shopId: EntityId;
}

export interface NearbyShopsInput extends PaginationInput {
  latitude:  number;
  longitude: number;
  radiusKm?: number;
  type?:     ShopType;
  category?: string;
}

export interface ShopStatsInput {
  ownerId: EntityId;
  from?:   Date;
  to?:     Date;
}

export interface ShopStatsResult {
  totalMembers: number;
  visitsToday:  number;
  activeOffers: number;
  subscriptionStatus: {
    plan:       ShopPlan;
    expiresAt?: Date;
  };
}

export interface RotateShopApiTokenInput {
  ownerId: EntityId;
}

export interface RotateShopApiTokenResult {
  token:     string;
  rotatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// MEMBERSHIP & LOYALTY
// ─────────────────────────────────────────────────────────────────────────────

export interface IRuleProgress {
  ruleId:      EntityId;
  visitCount:  number;
  pointsCount: number;
  spendCount:  number;
  version:     number;
  status:      'active' | 'completed' | 'expired';
}

export interface JoinShopInput {
  customerId: EntityId;
  shopId:     EntityId;
}

export interface CustomerMembershipsInput extends PaginationInput {
  customerId: EntityId;
}

export interface CustomerMembershipInput {
  customerId: EntityId;
  shopId:     EntityId;
}

export interface ShopMembersInput extends PaginationInput {
  ownerId: EntityId;
  search?: string;
}

export interface RedeemRewardInput {
  rewardId: EntityId;
  ownerId:  EntityId;
}

export interface MarkVisitInput {
  ownerId:          EntityId;
  customerEmail:    string;
  serviceId?:       EntityId;
  markedByMethod?:  MarkedByMethod;
  checkinToken?:    string;
  locationVerified?: boolean;
  customerLat?:     number;    // added — GPS fraud check
  customerLng?:     number;    // added — GPS fraud check
  spendAmount?:     number;
  productsBought?:  Array<{
    productId?:   string;
    productName:  string;
    quantity:     number;
    points?:      number;
  }>;
}

export interface MarkPosVisitInput {
  shopId:           EntityId;
  customerEmail:    string;
  serviceId?:       EntityId;
  checkinToken?:    string;
  locationVerified?: boolean;
  customerLat?:     number;    // added — GPS fraud check
  customerLng?:     number;    // added — GPS fraud check
  spendAmount?:     number;
  productsBought?:  Array<{
    productId?:   string;
    productName:  string;
    quantity:     number;
    points?:      number;
  }>;
}

export interface VisitHistoryInput extends PaginationInput {
  membershipId: EntityId;
  requesterId:  EntityId;
}

export interface CreateOrUpdateLoyaltyRuleInput {
  ownerId:            EntityId;
  serviceId?:         EntityId;
  title:              string;
  loyaltyType:        LoyaltyType;
  config:             Record<string, any>;
  reward: {
    type:  RewardType;
    value: string;
  };
  visitsRequired?:    number;
  rewardDescription?: string;
}

export interface GetAllActiveRulesInput {
  ownerId: EntityId;
}

export interface GetRuleHistoryInput {
  ownerId: EntityId;
}

export interface GetMyRewardsInput extends PaginationInput {
  customerId: EntityId;
  status?:    'pending' | 'redeemed';
}

export interface LeaveShopInput {
  customerId: EntityId;
  shopId:     EntityId;
}

export interface DeleteRuleInput {
  ownerId:  EntityId;
  ruleId:   EntityId;
}

export interface GetShopMemberByIdInput {
  ownerId:      EntityId;
  membershipId: EntityId;
}

export interface ShopMemberDetailResult {
  membership:    IMembership;
  customer:      IUser;
  visitHistory:  IVisit[];
  totalPoints:   number;
  tierLevel:     string;
  activeRewards: INotification[];
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECKIN
// ─────────────────────────────────────────────────────────────────────────────

export interface GenerateCheckinTokenInput {
  customerId: EntityId;
  shopId?:    EntityId;
}

export interface GenerateCheckinTokenResult {
  token:         string;
  qrFormat:      string;
  barcodeFormat: string;
  expiresAt:     Date;
}

export interface VerifyCheckinTokenInput {
  token:        string;
  shopId:       EntityId;
  usedByDevice: UsedByDevice;
}

// ─────────────────────────────────────────────────────────────────────────────
// OFFERS
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateOfferInput {
  ownerId:       EntityId;
  title:         string;
  description:   string;
  imageUrl?:     string;
  discountType:  DiscountType;
  discountValue: string;
  startDate:     Date;
  endDate:       Date;
  expiresAt?:    Date;
}

export interface UpdateOfferInput {
  ownerId:        EntityId;
  offerId:        EntityId;
  title?:         string;
  description?:   string;
  imageUrl?:      string;
  discountType?:  DiscountType;
  discountValue?: string;
  startDate?:     Date;
  endDate?:       Date;
  expiresAt?:     Date;
  isActive?:      boolean;
}

export interface GetShopOffersInput extends PaginationInput {
  ownerId:   EntityId;
  isActive?: boolean;
}

export interface CustomerOffersInput extends PaginationInput {
  customerId: EntityId;
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

export interface GetNotificationsInput extends PaginationInput {
  customerId: EntityId;
}

export interface MarkNotificationReadInput {
  notificationId: EntityId;
  customerId:     EntityId;
}

export interface MarkAllReadInput {
  customerId: EntityId;
}

// ─────────────────────────────────────────────────────────────────────────────
// POINTS
// ─────────────────────────────────────────────────────────────────────────────

export interface GetPointsHistoryInput extends PaginationInput {
  customerId: EntityId;
  shopId?:    EntityId;
}

export interface GetPointsBalanceInput {
  customerId: EntityId;
  shopId:     EntityId;
}

export interface GetPointsBalanceResult {
  totalPoints: number;
  tierLevel:   string;
  ledger:      IPointsLedger[];
}

// ─────────────────────────────────────────────────────────────────────────────
// TIER
// ─────────────────────────────────────────────────────────────────────────────

export interface EvaluateTierInput {
  customerId: EntityId;
  shopId:     EntityId;
}

export interface GetTierStatusInput {
  customerId: EntityId;
  shopId:     EntityId;
}

export interface GetTierStatusResult {
  currentTier:   string;
  totalPoints:   number;
  nextTier?:     string;
  pointsToNext?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// REFERRAL
// ─────────────────────────────────────────────────────────────────────────────

export interface GenerateReferralCodeInput {
  customerId: EntityId;
  shopId:     EntityId;
}

export interface ApplyReferralCodeInput {
  code:          string;
  newCustomerId: EntityId;
}

export interface GetReferralsInput extends PaginationInput {
  customerId: EntityId;
  shopId?:    EntityId;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADS
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateAdCampaignInput {
  ownerId?:         EntityId;
  title:            string;
  description:      string;
  imageUrl?:        string;
  adType:           AdType;
  weeklyBudget:     number;
  startDate?:       Date;
  endDate:          Date;
  externalContact?: IExternalContact;
  linkedOfferId?:   EntityId;
}

export interface IExternalContact {
  contactName:  string;
  contactPhone: string;
  contactEmail: string;
  shopName:     string;
}

export interface UpdateAdCampaignInput {
  ownerId:       EntityId;
  adId:          EntityId;
  title?:        string;
  description?:  string;
  imageUrl?:     string;
  weeklyBudget?: number;
  startDate?:    Date;
  endDate?:      Date;
  isActive?:     boolean;
}

export interface DeleteAdCampaignInput {
  ownerId: EntityId;
  adId:    EntityId;
}

export interface RecordClickInput {
  adId: EntityId;
}

export interface CustomerAdFeedInput extends PaginationInput {
  customerId: EntityId;
}

export interface ShopAdCampaignsInput extends PaginationInput {
  ownerId:   EntityId;
  isActive?: boolean;
  adType?:   AdType;
}

export interface ShopAdStatsInput {
  ownerId: EntityId;
  from?:   Date;
  to?:     Date;
}

export interface ShopAdStatsResult {
  totalImpressions: number;
  totalClicks:      number;
  totalSpend:       number;
  activeCampaigns:  number;
}

export interface SubmitExternalAdInput {
  title:           string;
  description:     string;
  imageUrl?:       string;
  weeklyBudget:    number;
  startDate?:      Date;
  endDate:         Date;
  externalContact: IExternalContact;
}

export interface AdminApproveAdInput {
  adminId: EntityId;
  adId:    EntityId;
  reason?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI POSTER
// ─────────────────────────────────────────────────────────────────────────────

export interface GeneratePosterInput {
  ownerId:       EntityId;
  shopName:      string;
  offerText:     string;
  tagline:       string;
  primaryColor?: string;
  style?:        PosterStyle;
  extraContext?: string;
}

export interface GeneratePosterResult {
  imageUrl:    string;
  prompt:      string;
  sessionData: {
    shopName:        string;
    offerText:       string;
    tagline:         string;
    primaryColor:    string;
    style:           PosterStyle;
    updatedElements: Record<string, string>;
  };
}

export interface DetectObjectInput {
  imageUrl:   string;
  maskRegion: MaskRegion;
}

export interface DetectObjectResult {
  detectedObject: string;
  caption:        string;
  suggestions:    string[];
}

export interface InpaintPosterInput {
  imageUrl:    string;
  maskRegion:  MaskRegion;
  replaceWith: string;
  style?:      PosterStyle;
}

export interface InpaintPosterResult {
  imageUrl: string;
}

export interface RegeneratePosterInput {
  ownerId:         EntityId;
  originalPrompt:  string;
  updatedElements: {
    background?:  string;
    font?:        string;
    colorScheme?: string;
    objects?:     Record<string, string>;
  };
}

export interface RegeneratePosterResult {
  imageUrl: string;
  prompt:   string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────────────────────────────────────

export interface AdminPaginationInput extends PaginationInput {
  adminId: EntityId;
}

export interface AdminShopListInput extends AdminPaginationInput {
  status?: ShopStatus;
  search?: string;
}

export interface ApproveShopInput {
  adminId: EntityId;
  shopId:  EntityId;
  ip?:     string;
}

export interface SuspendShopInput extends ApproveShopInput {
  reason: string;
}

export interface AdminUsersInput extends AdminPaginationInput {
  search?: string;
}

export interface AdminAdsInput extends PaginationInput {
  adminId:   EntityId;
  isActive?: boolean;
  adType?:   AdType;
}

export interface AdminPauseAdInput {
  adminId: EntityId;
  adId:    EntityId;
  reason:  string;
}

export interface AdminDeleteAdInput {
  adminId: EntityId;
  adId:    EntityId;
  reason:  string;
}

export interface RemoveAdInput {
  adminId:  EntityId;
  adId:     EntityId;
  ip?:      string;
  reason?:  string;
}

export interface AuditLogsInput extends AdminPaginationInput {
  action?:     IAuditLog['action'];
  targetType?: IAuditLog['targetType'];
  from?:       Date;
  to?:         Date;
}

export interface PlatformStatsResult {
  totalShops:  number;
  totalUsers:  number;
  visitsToday: number;
  revenue:     number;
  activeAds:   number;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────────────────────────────────────

export interface CreatePaymentIntentInput {
  ownerId: EntityId;
  plan:    PaymentPlan;
}

export interface PaymentIntentResult {
  payment:      IPayment;
  redirectUrl?: string;
  payload?:     Record<string, unknown>;
}

export interface PayHereWebhookInput {
  payload:    Record<string, unknown>;
  signature?: string;
  ip?:        string;
}

export interface AdminPaymentsInput extends AdminPaginationInput {
  status?: PaymentStatus;
  plan?:   PaymentPlan;
}

// ─────────────────────────────────────────────────────────────────────────────
// POS
// ─────────────────────────────────────────────────────────────────────────────

export interface RotatePosTokenInput {
  ownerId: EntityId;
}

export interface ValidatePosTokenInput {
  token: string;
}

export interface ValidatePosTokenResult {
  shop: IShop;
}

// ─────────────────────────────────────────────────────────────────────────────
// POPULATED TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type ShopWithOwner          = IShop       & { ownerId:      IUser       };
export type MembershipWithShop     = IMembership & { shopId:       IShop       };
export type MembershipWithCustomer = IMembership & { customerId:   IUser       };
export type VisitWithMembership    = IVisit      & { membershipId: IMembership };
export type OfferWithShop          = IOffer      & { shopId:       IShop       };
export type AdWithShop             = IAd         & { shopId:       IShop       };
export type MembershipWithShopAndRules = IMembership & {
  shopId:       IShop;
  ruleProgress: Array<IRuleProgress & { ruleId: ILoyaltyRule }>;
};