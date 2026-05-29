import { Router } from 'express';
import * as memberController from '../controllers/member.controller.js';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import { joinShopParamSchema, shopMembersQuerySchema } from '../validators/loyalty.schemas.js';
import { customerMembershipsQuerySchema, customerMembershipParamSchema, membershipIdParamSchema } from '../validators/member.schemas.js';


const router = Router();

router.post('/join/:shopId',          protect, restrictTo('customer'), validate({ params: joinShopParamSchema }),           memberController.joinShop);
router.delete('/join/:shopId',        protect, restrictTo('customer'), validate({ params: joinShopParamSchema }),           memberController.leaveShop);
router.get('/me',                     protect, restrictTo('customer'), validate({ query: customerMembershipsQuerySchema }), memberController.getCustomerMemberships);
router.get('/me/:shopId',             protect, restrictTo('customer'), validate({ params: customerMembershipParamSchema }), memberController.getCustomerMembership);
router.get('/shop',                   protect, restrictTo('shop'),     validate({ query: shopMembersQuerySchema }),         memberController.getShopMembers);
router.get('/shop/:membershipId',     protect, restrictTo('shop'),     validate({ params: membershipIdParamSchema }),       memberController.getShopMemberById);

export default router;