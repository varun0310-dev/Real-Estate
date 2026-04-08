// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const {
    register,
    login,
    logout,
    verifyOtp,
    forgotPassword,
    resetPassword,
    googleLogin
} = require('../controllers/authController');

// Auth-only routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/verify-otp', verifyOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/google-login', googleLogin);

module.exports = router;