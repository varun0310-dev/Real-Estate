const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const upload = require('../middleware/upload');
const { getLogo, uploadLogo, deleteLogo } = require('../controllers/settingsController');

// Public — anyone can fetch the current logo
router.get('/logo', getLogo);

// Protected — only superadmin can upload/delete logo
router.post('/logo', auth, checkRole(['superadmin']), upload.single('logo'), uploadLogo);
router.delete('/logo', auth, checkRole(['superadmin']), deleteLogo);

module.exports = router;
