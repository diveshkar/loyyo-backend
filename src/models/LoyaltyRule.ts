import { Schema, model, Document, Types } from 'mongoose';
import {
  LOYALTY_TYPES,
  REWARD_TYPES,
  TIME_WINDOW_TYPES,
  EXPIRE_ACTIONS,
  type LoyaltyType,
  type RewardType,
  type TimeWindowType,
  type ExpireAction,
} from './enums.js';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG INTERFACES — one per loyalty type
// ─────────────────────────────────────────────────────────────────────────────

export interface ITimeWindow {
  type:   TimeWindowType;
  value?: number;          // e.g. 3 for every 3 months
}

export interface ITierLevel {
  name:         string;    // Silver | Gold | Platinum
  min_points:   number;
  reward_type:  RewardType;
  reward_value: string;
}

export interface IProductPoints {
  product_id:   string;
  product_name: string;
  points:       number;
}

export interface ILoyaltyConfig {
  // --- VISIT BASED ---
  visit_count_target?: number;

  // --- POINTS BASED ---
  points_per_visit?:   number;
  points_per_spend?:   number;    // points per LKR spent
  points_target?:      number;    // points needed for reward

  // --- SPEND BASED ---
  spend_target?:       number;    // LKR target

  // --- PRODUCT BASED ---
  product_points?:     IProductPoints[];

  // --- HYBRID ---
  visits_needed?:      number;
  points_needed?:      number;

  // --- TIER BASED ---
  tiers?:              ITierLevel[];

  // --- REFERRAL ---
  referrer_points?:    number;
  referee_points?:     number;

  // --- EVENT / SEASONAL ---
  event_name?:         string;
  points_multiplier?:  number;    // 2 = double points
  event_start?:        Date;
  event_end?:          Date;

  // --- UNIVERSAL — works with any type ---
  time_window?:        ITimeWindow;
  expire_action?:      ExpireAction;  // reset | carry_over | freeze
}

export interface ILoyaltyRewardConfig {
  type:  RewardType;
  value: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT INTERFACE
// ─────────────────────────────────────────────────────────────────────────────

export interface ILoyaltyRule extends Document {
  shopId:            Types.ObjectId;
  serviceId?:        Types.ObjectId;
  title:             string;
  loyaltyType:       LoyaltyType;
  config:            ILoyaltyConfig;    // typed now — not any
  reward:            ILoyaltyRewardConfig;
  version:           number;
  isActive:          boolean;
  createdAt:         Date;
  updatedAt:         Date;

  // backward compat — keep for old service calls
  visitsRequired?:   number;
  rewardDescription?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

const LoyaltyRuleSchema = new Schema<ILoyaltyRule>(
  {
    shopId: {
      type:     Schema.Types.ObjectId,
      ref:      'Shop',
      required: [true, 'Shop ID is required'],
      index:    true,
    },
    serviceId: {
      type:  Schema.Types.ObjectId,
      ref:   'Service',
      index: true,
    },
    title: {
      type:     String,
      required: [true, 'Loyalty rule title is required'],
      trim:     true,
    },
    loyaltyType: {
      type:     String,
      enum:     LOYALTY_TYPES,
      required: true,
      default:  'visit',
      index:    true,
    },
    config: {
      type:     Schema.Types.Mixed,
      required: true,
      default:  {},
    },
    reward: {
      type: {
        type: {
          type:     String,
          enum:     REWARD_TYPES,
          required: true,
        },
        value: {
          type:     String,
          required: true,
          trim:     true,
        },
      },
      required: true,
      _id:      false,
    },
    version: {
      type:     Number,
      required: true,
      default:  1,
    },
    isActive: {
      type:    Boolean,
      default: true,
      index:   true,
    },

    // backward compat fields
    visitsRequired: {
      type: Number,
      min:  [1, 'Must require at least 1 visit'],
    },
    rewardDescription: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// PRE VALIDATE — sync backward compat fields
// ─────────────────────────────────────────────────────────────────────────────

LoyaltyRuleSchema.pre('validate', function () {
  this.config ??= {};

  // visit backward compat
  if (this.loyaltyType === 'visit' && this.visitsRequired && !this.config.visit_count_target) {
    this.config.visit_count_target = this.visitsRequired;
  }
  if (!this.visitsRequired && this.config.visit_count_target) {
    this.visitsRequired = Number(this.config.visit_count_target);
  }

  // reward backward compat
  if (!this.reward && this.rewardDescription) {
    this.reward = { type: 'voucher', value: this.rewardDescription };
  }
  if (!this.rewardDescription && this.reward?.value) {
    this.rewardDescription = this.reward.value;
  }

  // event — auto set isActive based on event dates
  if (this.loyaltyType === 'event' && this.config.event_end) {
    if (new Date(this.config.event_end) < new Date()) {
      this.isActive = false;
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// INDEXES
// ─────────────────────────────────────────────────────────────────────────────

LoyaltyRuleSchema.index({ shopId: 1, title: 1, version: 1 }, { unique: true });
LoyaltyRuleSchema.index({ shopId: 1, serviceId: 1, isActive: 1 });
LoyaltyRuleSchema.index({ shopId: 1, loyaltyType: 1, isActive: 1 });

export const LoyaltyRule = model<ILoyaltyRule>('LoyaltyRule', LoyaltyRuleSchema);