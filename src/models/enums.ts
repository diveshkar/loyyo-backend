export const USER_ROLES = ['customer', 'shop', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const BUSINESS_TYPES = ['physical', 'home'] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const SHOP_TYPES = [
  'tea_shop',
  'salon',
  'restaurant',
  'supermarket',
  'clothing',
  'electronics',
  'gym',
  'pharmacy',
  'grocery',
  'bakery',
  'home_bakery',
  'home_kitchen',
  'home_salon',
  'home_tuition',
  'handmade',
  'reseller',
  'other',
] as const;
export type ShopType = (typeof SHOP_TYPES)[number];

export const SHOP_PLANS = ['micro', 'free', 'basic', 'standard', 'premium'] as const;
export type ShopPlan = (typeof SHOP_PLANS)[number];

export const SHOP_STATUSES = ['pending', 'active', 'suspended'] as const;
export type ShopStatus = (typeof SHOP_STATUSES)[number];

export const LOYALTY_TYPES = [
  'visit',
  'points',
  'spend',
  'product',
  'hybrid',
  'tier',
  'referral',
  'event',
] as const;
export type LoyaltyType = (typeof LOYALTY_TYPES)[number];

export const TIME_WINDOW_TYPES = ['daily', 'weekly', 'monthly', 'custom', 'none'] as const;
export type TimeWindowType = (typeof TIME_WINDOW_TYPES)[number];

export const EXPIRE_ACTIONS = ['reset', 'carry_over', 'freeze'] as const;
export type ExpireAction = (typeof EXPIRE_ACTIONS)[number];

export const REWARD_TYPES = [
  'free_item',
  'percent_discount',
  'fixed_discount',
  'cashback',
  'voucher',
  'buy_x_get_y',
] as const;
export type RewardType = (typeof REWARD_TYPES)[number];

export const TIER_LEVELS = ['none', 'silver', 'gold', 'platinum'] as const;
export type TierLevel = (typeof TIER_LEVELS)[number];

export const RULE_PROGRESS_STATUSES = ['active', 'completed', 'expired'] as const;
export type RuleProgressStatus = (typeof RULE_PROGRESS_STATUSES)[number];

export const MARKED_BY_METHODS = ['qr_scan', 'barcode_scan', 'kiosk', 'plugin', 'manual', 'order_code'] as const;
export type MarkedByMethod = (typeof MARKED_BY_METHODS)[number];

export const USED_BY_DEVICES = ['mobile_camera', 'usb_scanner', 'kiosk', 'plugin'] as const;
export type UsedByDevice = (typeof USED_BY_DEVICES)[number];

export const POINTS_ACTIONS = ['earn', 'redeem', 'expire', 'bonus', 'referral'] as const;
export type PointsAction = (typeof POINTS_ACTIONS)[number];

export const POINTS_SOURCES = ['visit', 'spend', 'product', 'referral', 'event', 'manual'] as const;
export type PointsSource = (typeof POINTS_SOURCES)[number];

export const DISCOUNT_TYPES = ['percent', 'free_item', 'fixed', 'cashback'] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const AD_TYPES = ['internal', 'boost', 'external'] as const;
export type AdType = (typeof AD_TYPES)[number];

export const REFERRAL_STATUSES = ['pending', 'completed', 'rewarded'] as const;
export type ReferralStatus = (typeof REFERRAL_STATUSES)[number];

export const NOTIFICATION_TYPES = [
  'visit_marked',
  'reward_earned',
  'offer',
  'tier_upgrade',
  'referral',
  'event',
  'reward_claimed',
  'points_expired',
  'order_code',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const AUDIT_ACTIONS = [
  'SHOP_APPROVED',
  'SHOP_SUSPENDED',
  'SHOP_REINSTATED',
  'USER_DEACTIVATED',
  'AD_APPROVED',
  'AD_PAUSED',
  'AD_REMOVED',
  'PAYMENT_REFUNDED',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_TARGET_TYPES = ['shop', 'user', 'ad', 'payment'] as const;
export type AuditTargetType = (typeof AUDIT_TARGET_TYPES)[number];