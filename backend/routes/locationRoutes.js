const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

router.get('/countries', locationController.getCountries);
router.get('/states/:countryId', locationController.getStates);
router.get('/cities/:stateId', locationController.getCities);
router.get('/all-cities', locationController.getAllCities);
router.get('/cities-with-counts', locationController.getCitiesWithCounts);

module.exports = router;
