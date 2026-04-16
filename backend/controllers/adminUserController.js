const User = require('../models/User');

// GET /api/admin/users — list all users with filtering
exports.getAllUsers = async (req, res) => {
    try {
        const { search, userType, status, page = 1, limit = 20 } = req.query;

        const filter = {};

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        if (userType && userType !== 'all') {
            filter.userType = userType;
        }

        if (status !== undefined && status !== 'all') {
            filter.status = status === 'true';
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('-password -otp -otpExpiresAt -resetPasswordToken -resetPasswordExpiresAt -refreshToken')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            User.countDocuments(filter)
        ]);

        res.json({
            users,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/admin/users/:id/role — change a user's role/userType
exports.updateUserRole = async (req, res) => {
    try {
        const { userType } = req.body;
        const userId = req.params.id;

        if (!userType) {
            return res.status(400).json({ message: 'userType is required' });
        }

        // Prevent changing own role
        if (userId === req.user._id.toString()) {
            return res.status(400).json({ message: 'You cannot change your own role' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.userType = userType;
        // Also sync the role field
        user.role = userType === 'superadmin' ? 'superadmin' : 'user';
        await user.save();

        res.json({ message: `User role updated to ${userType}`, user });
    } catch (err) {
        console.error('Error updating user role:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/admin/users/:id/status — toggle user active/inactive
exports.updateUserStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const userId = req.params.id;

        if (userId === req.user._id.toString()) {
            return res.status(400).json({ message: 'You cannot deactivate your own account' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.status = status;
        await user.save();

        res.json({ message: `User ${status ? 'activated' : 'deactivated'}`, user });
    } catch (err) {
        console.error('Error updating user status:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/admin/users/:id — delete a user
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        if (userId === req.user._id.toString()) {
            return res.status(400).json({ message: 'You cannot delete your own account' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.userType === 'superadmin') {
            return res.status(403).json({ message: 'Cannot delete superadmin accounts' });
        }

        await User.findByIdAndDelete(userId);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
