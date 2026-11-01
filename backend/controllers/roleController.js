const Role = require('../models/Role');
const { FIXED_ROLES, seedDefaultRoles } = require('../scripts/seedRoles');

// GET /api/roles — list all roles
exports.getAllRoles = async (req, res) => {
    try {
        const roles = await Role.find().sort({ isSystem: -1, createdAt: -1 });
        res.json(roles);
    } catch (err) {
        console.error('Error fetching roles:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/roles/:id — get single role
exports.getRoleById = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);
        if (!role) return res.status(404).json({ message: 'Role not found' });
        res.json(role);
    } catch (err) {
        console.error('Error fetching role:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/roles — disabled: roles are fixed (buyer, seller, superadmin)
exports.createRole = async (req, res) => {
    return res.status(403).json({
        message: 'Custom roles cannot be created. This project uses three fixed roles: Buyer, Seller, and Superadmin.',
    });
};

// PUT /api/roles/:id — update a role
exports.updateRole = async (req, res) => {
    try {
        const { name, description, permissions, status } = req.body;
        const role = await Role.findById(req.params.id);

        if (!role) return res.status(404).json({ message: 'Role not found' });

        if (role.isSystem) {
            if (description !== undefined) role.description = description;
            if (status !== undefined) role.status = status;
            await role.save();
            return res.json({ message: 'System role details updated', role });
        }

        if (name) role.name = name.trim().toLowerCase();
        if (description !== undefined) role.description = description;
        if (permissions !== undefined) role.permissions = permissions;
        if (status !== undefined) role.status = status;

        await role.save();
        res.json({ message: 'Role updated successfully', role });
    } catch (err) {
        console.error('Error updating role:', err);
        if (err.code === 11000) {
            return res.status(400).json({ message: 'A role with this name already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/roles/:id — delete a role
exports.deleteRole = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);
        if (!role) return res.status(404).json({ message: 'Role not found' });

        if (role.isSystem) {
            return res.status(403).json({ message: 'System roles cannot be deleted' });
        }

        await Role.findByIdAndDelete(req.params.id);
        res.json({ message: 'Role deleted successfully' });
    } catch (err) {
        console.error('Error deleting role:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.seedDefaultRoles = seedDefaultRoles;
exports.FIXED_ROLES = FIXED_ROLES;
