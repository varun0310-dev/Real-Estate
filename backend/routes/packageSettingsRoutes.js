const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    getPackageSettings,
    getAllPackageSettings,
    updatePackageSetting,
} = require('../controllers/packageSettingsController');

// Super admin guard middleware
const superAdminOnly = (req, res, next) => {
    if (req.user?.userType !== 'superadmin') {
        return res.status(403).json({ message: 'Access denied. Super admin only.' });
    }
    next();
};

// Public: anyone can get active package info (used by PricingPage)
router.get('/', getPackageSettings);

// Protected: super admin can get all plans (including inactive)
router.get('/all', auth, superAdminOnly, getAllPackageSettings);

// Protected: super admin can update a plan by key
router.put('/:planKey', auth, superAdminOnly, updatePackageSetting);

module.exports = router;
