const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { validateCoupon } = require('../controllers/couponController');

router.post('/validate', auth, validateCoupon);

module.exports = router;
