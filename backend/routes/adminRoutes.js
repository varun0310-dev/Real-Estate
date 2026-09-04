const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const { getAllUsers, updateUserRole, updateUserStatus, deleteUser } = require('../controllers/adminUserController');
const { getAllConversations } = require('../controllers/adminConversationController');

// All admin user routes require auth + superadmin
router.use(auth, checkRole(['superadmin']));

router.get('/users', getAllUsers);
router.get('/conversations', getAllConversations);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

module.exports = router;
