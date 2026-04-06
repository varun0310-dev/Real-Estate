const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

const authenticate = require('../middleware/auth');
const maybeAuth = require('../middleware/maybeAuth');

router.post('/', authenticate, categoryController.createCategory);
router.get('/', maybeAuth, categoryController.getCategories);
router.get('/all', maybeAuth, categoryController.getAllCategories);
router.put('/:id', authenticate, categoryController.updateCategory);
router.delete('/:id', authenticate, categoryController.deleteCategory);

module.exports = router;
