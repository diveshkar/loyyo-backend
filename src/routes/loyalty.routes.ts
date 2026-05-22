import { Router } from 'express';
import * as loyaltyController from '../controllers/loyalty.controller.js';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import {
  loyaltyRuleSchema,
  markVisitSchema,
  visitHistoryParamSchema,
  visitHistoryQuerySchema,
  joinShopParamSchema,
  membershipParamSchema,
  shopMembersQuerySchema,
  redeemRewardParamSchema,
} from '../validators/loyalty.schemas.js';

const router = Router();

// ─── LOYALTY RULES (Shop) ─────────────────────────────────────────────────────

// Create or update loyalty rule
router.post('/rules',
  protect,
  restrictTo('shop'),
  validate({ body: loyaltyRuleSchema }),
  loyaltyController.createOrUpdateRule
);

// Get current active rule for this shop
router.get('/rules',
  protect,
  restrictTo('shop'),
  loyaltyController.getCurrentRule
);

// Get all rule versions (history)
router.get('/rules/history',
  protect,
  restrictTo('shop'),
  loyaltyController.getRuleHistory
);

// ─── VISIT MARKING (Shop) ─────────────────────────────────────────────────────

// Shop owner marks a visit manually
router.post('/visit',
  protect,
  restrictTo('shop'),
  validate({ body: markVisitSchema }),
  loyaltyController.markVisit
);

// Visit history for a specific membership
router.get('/history/:membershipId',
  protect,
  restrictTo('shop'),
  validate({ params: visitHistoryParamSchema, query: visitHistoryQuerySchema }),
  loyaltyController.getVisitHistory
);

// ─── MEMBERS (Shop) ───────────────────────────────────────────────────────────

// Search members — used on mark visit page
router.get('/members',
  protect,
  restrictTo('shop'),
  validate({ query: shopMembersQuerySchema }),
  loyaltyController.getShopMembers
);

// ─── MEMBERSHIP (Customer) ────────────────────────────────────────────────────

// Customer joins a shop
router.post('/join/:shopId',
  protect,
  restrictTo('customer'),
  validate({ params: joinShopParamSchema }),
  loyaltyController.joinShop
);

// Customer gets all their memberships
router.get('/memberships',
  protect,
  restrictTo('customer'),
  loyaltyController.getMyMemberships
);

// Customer gets single membership card
router.get('/memberships/:shopId',
  protect,
  restrictTo('customer'),
  validate({ params: membershipParamSchema }),
  loyaltyController.getMembershipCard
);

// ─── REWARDS (Customer + Shop) ────────────────────────────────────────────────

// Customer sees all their rewards
router.get('/rewards',
  protect,
  restrictTo('customer'),
  loyaltyController.getMyRewards
);

// Shop owner redeems a reward for a customer
router.post('/rewards/:rewardId/redeem',
  protect,
  restrictTo('shop'),
  validate({ params: redeemRewardParamSchema }),
  loyaltyController.redeemReward
);

export default router;