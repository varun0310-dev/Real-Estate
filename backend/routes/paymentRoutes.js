const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    createRazorpayOrder,
    verifyRazorpayPayment,
} = require('../controllers/paymentController');

router.post('/razorpay/create-order', auth, createRazorpayOrder);
router.post('/razorpay/verify', auth, verifyRazorpayPayment);

module.exports = router;
