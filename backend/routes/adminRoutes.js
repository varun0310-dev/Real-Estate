const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const { getAllUsers, updateUserRole, updateUserStatus, deleteUser } = require('../controllers/adminUserController');
const { getAllConversations, deleteConversation } = require('../controllers/adminConversationController');
const { createCoupon, getCoupons, updateCoupon, deleteCoupon, toggleCouponStatus, getSellersList } = require('../controllers/adminCouponController');

// All admin user routes require auth + superadmin
router.use(auth, checkRole(['superadmin']));

router.get('/users', getAllUsers);
router.get('/conversations', getAllConversations);
router.delete('/conversations/:id', deleteConversation);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

// Coupon Management Routes
router.post('/coupons', createCoupon);
router.get('/coupons', getCoupons);
router.get('/coupons/sellers', getSellersList);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);
router.patch('/coupons/:id/status', toggleCouponStatus);

module.exports = router;
