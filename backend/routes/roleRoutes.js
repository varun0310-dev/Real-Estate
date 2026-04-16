const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const { getAllRoles, getRoleById, createRole, updateRole, deleteRole } = require('../controllers/roleController');

// All role routes require auth + superadmin
router.use(auth, checkRole(['superadmin']));

router.get('/', getAllRoles);
router.get('/:id', getRoleById);
router.post('/', createRole);
router.put('/:id', updateRole);
router.delete('/:id', deleteRole);

module.exports = router;
