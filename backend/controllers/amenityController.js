const Amenity = require('../models/Amenity');
const Property = require('../models/Property');

// Create Amenity
exports.createAmenity = async (req, res) => {
    try {
        const { name, description } = req.body;
        const exists = await Amenity.findOne({ name });
        if (exists) return res.status(400).json({ message: 'Amenity already exists' });

        const newAmenity = new Amenity({ name, description, seller: req.user._id });
        await newAmenity.save();
        res.status(201).json(newAmenity);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get All Amenities (with optional pagination)
exports.getAmenities = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.limit) || 0;

        let query = {};
        if (req.user && req.user.userType !== 'superadmin') {
            query.seller = req.user._id;
        }

        if (page > 0 && limit > 0) {
            const skip = (page - 1) * limit;
            const amenities = await Amenity.find(query)
                .populate('seller', 'name email profileImage')
                .sort({ name: 1 })
                .skip(skip)
                .limit(limit);
            const total = await Amenity.countDocuments(query);
            return res.status(200).json({
                amenities,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalAmenities: total
            });
        }

        // Return all if no pagination params
        const amenities = await Amenity.find(query).sort({ name: 1 });
        res.status(200).json(amenities);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Update Amenity
exports.updateAmenity = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        const amenity = await Amenity.findById(id);
        if (!amenity) return res.status(404).json({ message: 'Amenity not found' });

        if (req.user.userType !== 'superadmin' && amenity.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this amenity' });
        }

        amenity.name = name;
        amenity.description = description;
        await amenity.save();

        res.status(200).json(amenity);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete Amenity
exports.deleteAmenity = async (req, res) => {
    try {
        const { id } = req.params;

        const amenity = await Amenity.findById(id);
        if (!amenity) return res.status(404).json({ message: 'Amenity not found' });

        if (req.user.userType !== 'superadmin' && amenity.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this amenity' });
        }

        // Check if any property uses this amenity
        const propertyCount = await Property.countDocuments({ amenities: id });
        if (propertyCount > 0) {
            return res.status(400).json({ 
                message: `Cannot delete amenity. There are ${propertyCount} properties using this amenity.` 
            });
        }

        await Amenity.findByIdAndDelete(id);

        res.status(200).json({ message: 'Amenity deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};
