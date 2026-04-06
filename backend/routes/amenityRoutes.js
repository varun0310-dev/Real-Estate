const express = require('express');
const router = express.Router();
const amenityController = require('../controllers/amenityController');
const authenticate = require('../middleware/auth');
const maybeAuth = require('../middleware/maybeAuth');

router.post('/', authenticate, amenityController.createAmenity);
router.get('/', maybeAuth, amenityController.getAmenities);
router.put('/:id', authenticate, amenityController.updateAmenity);
router.delete('/:id', authenticate, amenityController.deleteAmenity);

module.exports = router;
