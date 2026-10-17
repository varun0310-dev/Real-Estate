const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    getMySubscription,
    subscribe,
    getPlans,
    checkSubscription,
} = require('../controllers/subscriptionController');

// Public: Get all available plans
router.get('/plans', getPlans);

// Protected: Seller must be logged in
router.get('/my', auth, getMySubscription);
router.get('/check', auth, checkSubscription);
router.post('/subscribe', auth, subscribe);

module.exports = router;
