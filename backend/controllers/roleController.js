const Role = require('../models/Role');

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

// POST /api/roles — create a new role
exports.createRole = async (req, res) => {
    try {
        const { name, description, permissions } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Role name is required' });
        }

        const existing = await Role.findOne({ name: name.trim().toLowerCase() });
        if (existing) {
            return res.status(400).json({ message: 'A role with this name already exists' });
        }

        const role = new Role({
            name: name.trim().toLowerCase(),
            description: description || '',
            permissions: permissions || [],
            isSystem: false
        });

        await role.save();
        res.status(201).json({ message: 'Role created successfully', role });
    } catch (err) {
        console.error('Error creating role:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/roles/:id — update a role
exports.updateRole = async (req, res) => {
    try {
        const { name, description, permissions, status } = req.body;
        const role = await Role.findById(req.params.id);

        if (!role) return res.status(404).json({ message: 'Role not found' });

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

// Seed default system roles (called once on startup)
exports.seedDefaultRoles = async () => {
    try {
        const defaults = [
            { name: 'superadmin', description: 'Full access to all features', permissions: ['all'], isSystem: true },
            { name: 'seller', description: 'Can manage own properties', permissions: ['properties.manage', 'profile.manage'], isSystem: true },
            { name: 'buyer', description: 'Can browse and save properties', permissions: ['properties.view', 'profile.manage'], isSystem: true },
        ];

        for (const def of defaults) {
            await Role.findOneAndUpdate(
                { name: def.name },
                def,
                { upsert: true, new: true }
            );
        }
        console.log('Default roles seeded');
    } catch (err) {
        console.error('Error seeding roles:', err);
    }
};
