

const User = require('../models/User');

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const {
            name,
            lastname,
            about,
            phone,
            address,
            city,
            state,
            zipCode,
            userType,
            companyName,
            licenseNumber,
            agencyName,
            yearsOfExperience,
            specialization,
            location
        } = req.body;

        const updateData = {
            name,
            lastname,
            about,
            phone,
            address,
            city,
            state,
            zipCode,
            userType,
            companyName,
            licenseNumber,
            agencyName,
            yearsOfExperience,
            specialization
        };

        if (location && typeof location === 'string') {
            try {
                const parsedLocation = JSON.parse(location);
                if (parsedLocation?.type === 'Point' && Array.isArray(parsedLocation.coordinates)) {
                    updateData.location = parsedLocation;
                }
            } catch (err) {
                console.warn('Invalid location format:', err.message);
            }
        }

        if (req.file) {
            updateData.profileImage = `/uploads/${req.file.filename}`;
        }

        console.log('Updating user with ID:', userId);
        console.log('Update payload:', updateData);

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'Profile updated', user: updatedUser });
    } catch (err) {
        console.error('Profile update error:', err.message);
        res.status(400).json({ message: 'Bad Request', error: err.message });
    }
};

exports.getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.status(200).json({ user });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};
