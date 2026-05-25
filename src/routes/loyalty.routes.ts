import { Router } from 'express';
import * as loyaltyController from '../controllers/loyalty.controller.js';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import {
  joinShopParamSchema,
  leaveShopParamSchema,
  loyaltyRuleSchema,
  markVisitSchema,
  memberIdParamSchema,
  membershipParamSchema,
  redeemRewardParamSchema,
  ruleIdParamSchema,
  shopMembersQuerySchema,
  visitHistoryParamSchema,
  visitHistoryQuerySchema,
} from '../validators/loyalty.schemas.js';

const router = Router();

// ─── LOYALTY RULES (Shop) ─────────────────────────────────────────────────────

router.post(
  '/rules',
  protect,
  restrictTo('shop'),
  validate({ body: loyaltyRuleSchema }),
  loyaltyController.createOrUpdateRule
);

router.get(
  '/rules',
  protect,
  restrictTo('shop'),
  loyaltyController.getCurrentRule
);

router.get(
  '/rules/history',
  protect,
  restrictTo('shop'),
  loyaltyController.getRuleHistory
);

router.delete(
  '/rules/:ruleId',
  protect,
  restrictTo('shop'),
  validate({ params: ruleIdParamSchema }),
  loyaltyController.deleteRule
);

// ─── VISIT MARKING (Shop) ─────────────────────────────────────────────────────

router.post(
  '/visit',
  protect,
  restrictTo('shop'),
  validate({ body: markVisitSchema }),
  loyaltyController.markVisit
);

router.get(
  '/history/:membershipId',
  protect,
  restrictTo('shop'),
  validate({
    params: visitHistoryParamSchema,
    query:  visitHistoryQuerySchema,
  }),
  loyaltyController.getVisitHistory
);

// ─── MEMBERS (Shop) ───────────────────────────────────────────────────────────

router.get(
  '/members',
  protect,
  restrictTo('shop'),
  validate({ query: shopMembersQuerySchema }),
  loyaltyController.getShopMembers
);

router.get(
  '/members/:membershipId',
  protect,
  restrictTo('shop'),
  validate({ params: memberIdParamSchema }),
  loyaltyController.getShopMemberById
);

// ─── MEMBERSHIP (Customer) ────────────────────────────────────────────────────

router.post(
  '/join/:shopId',
  protect,
  restrictTo('customer'),
  validate({ params: joinShopParamSchema }),
  loyaltyController.joinShop
);

router.delete(
  '/leave/:shopId',
  protect,
  restrictTo('customer'),
  validate({ params: leaveShopParamSchema }),
  loyaltyController.leaveShop
);

router.get(
  '/memberships',
  protect,
  restrictTo('customer'),
  loyaltyController.getMyMemberships
);

router.get(
  '/memberships/:shopId',
  protect,
  restrictTo('customer'),
  validate({ params: membershipParamSchema }),
  loyaltyController.getMembershipCard
);

// ─── REWARDS (Customer + Shop) ────────────────────────────────────────────────

router.get(
  '/rewards',
  protect,
  restrictTo('customer'),
  loyaltyController.getMyRewards
);

router.post(
  '/rewards/:rewardId/redeem',
  protect,
  restrictTo('shop'),
  validate({ params: redeemRewardParamSchema }),
  loyaltyController.redeemReward
);

export default router;