const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const authenticate = require('../middleware/auth'); 
const checkRole = require('../middleware/checkRole');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/properties');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Image upload setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

router.post('/upload', authenticate, upload.array('images', 10), (req, res) => {
    if (!req.files) return res.status(400).json({ message: 'No files uploaded' });
    const paths = req.files.map(file => `/uploads/properties/${file.filename}`);
    res.json({ message: 'Upload successful', images: paths });
});

router.post(
    '/',
    authenticate,
    upload.array('images', 10),
    propertyController.createProperty
);

router.get('/', propertyController.getAllProperties);
router.get('/my-properties', authenticate, propertyController.getMyProperties);
router.put('/:id', authenticate, propertyController.updateProperty);
router.patch('/:id/status', authenticate, propertyController.updatePropertyStatus);
router.delete('/:id', authenticate, propertyController.deleteProperty);

router.get('/:id', propertyController.getPropertyById);

module.exports = router;