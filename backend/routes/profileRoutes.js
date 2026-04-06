// routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const { updateProfile, getMyProfile } = require('../controllers/userController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Get logged-in user's profile
router.get('/me', auth, getMyProfile);

// Update profile (with image upload)
router.put('/', auth, upload.single('profileImage'), updateProfile);

module.exports = router;
