const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const {
    createRazorpayOrder,
    verifyRazorpayPayment,
    getMyTransactions,
    getInvoice,
    getAllPayments,
    getAllSubscriptions,
} = require('../controllers/paymentController');

// Rate limiting for payment endpoints (prevent abuse)
const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,                   // max 10 payment attempts per 15 min
    message: { message: 'Too many payment requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const orderLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,  // 5 minutes
    max: 5,                    // max 5 order creations per 5 min
    message: { message: 'Too many order requests. Please wait before trying again.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// ── Seller payment flow ──
router.post('/razorpay/create-order', auth, orderLimiter, createRazorpayOrder);
router.post('/razorpay/verify', auth, paymentLimiter, verifyRazorpayPayment);

// ── Seller transaction history ──
router.get('/my-transactions', auth, getMyTransactions);

// ── Invoice (owner or admin) ──
router.get('/invoice/:paymentId', auth, getInvoice);

// ── Super admin routes ──
router.get('/admin/all', auth, checkRole(['superadmin']), getAllPayments);
router.get('/admin/subscriptions', auth, checkRole(['superadmin']), getAllSubscriptions);

module.exports = router;
