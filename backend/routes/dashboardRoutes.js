const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getDashboardStats } = require('../controllers/dashboardController');

// GET /api/dashboard/stats — Authenticated for Buyer, Seller, and Superadmin
router.get('/stats', auth, getDashboardStats);

module.exports = router;

