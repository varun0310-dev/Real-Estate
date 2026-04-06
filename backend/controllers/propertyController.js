const Property = require('../models/Property');
const User = require('../models/User');
const mongoose = require('mongoose');

exports.createProperty = async (req, res) => {
    try {
        const sellerId = req.user._id;

        const propertyData = { ...req.body };
        propertyData.seller = sellerId;
        propertyData.categoryId = req.body.category;
        propertyData.propertyStatus = 'Pending'; // Force pending status on creation

        const property = new Property(propertyData);

        if (req.files && req.files.length > 0) {
            property.images = req.files.map(file => `/uploads/properties/${file.filename}`);
        }

        await property.save();
        res.status(201).json({ message: 'Property created successfully', property });
    } catch (err) {
        console.error('Property creation error:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

exports.getAllProperties = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        // Sorting logic
        let sortObj = { createdAt: -1 }; // Default: Newest
        if (req.query.sort) {
            switch(req.query.sort) {
                case 'price-low':
                    sortObj = { price: 1 };
                    break;
                case 'price-high':
                    sortObj = { price: -1 };
                    break;
                case 'newest':
                    sortObj = { createdAt: -1 };
                    break;
                default:
                    sortObj = { createdAt: -1 };
            }
        }

        // Default to Approved properties for public view
        let query = { propertyStatus: 'Approved' };

        // --- REAL ESTATE FILTERING ---
        
        // 1. Listing Status (Buy/Rent)
        if (req.query.type && req.query.type !== 'all' && req.query.type !== 'All Status') {
            if (req.query.type.toLowerCase() === 'buy' || req.query.type === 'For Sale') query.propertyType = 'For Sale';
            else if (req.query.type.toLowerCase() === 'rent' || req.query.type === 'For Rent') query.propertyType = 'For Rent';
            else query.propertyType = req.query.type;
        }
        
        // 2. Categories (Multi-select support)
        if (req.query.categoryId && req.query.categoryId !== 'all' && req.query.categoryId !== 'All Types') {
            const rawIds = req.query.categoryId.toString().split(',');
            const validIds = rawIds
                .map(id => id.trim())
                .filter(id => mongoose.Types.ObjectId.isValid(id))
                .map(id => new mongoose.Types.ObjectId(id));

            if (validIds.length > 0) {
                query.categoryId = { $in: validIds };
            }
        }

        // 3. Location (Cascading IDs)
        if (req.query.countryId && req.query.countryId !== 'all' && mongoose.Types.ObjectId.isValid(req.query.countryId)) {
            query.countryId = new mongoose.Types.ObjectId(req.query.countryId);
        }
        if (req.query.stateId && req.query.stateId !== 'all' && mongoose.Types.ObjectId.isValid(req.query.stateId)) {
            query.stateId = new mongoose.Types.ObjectId(req.query.stateId);
        }
        if (req.query.cityId && req.query.cityId !== 'all' && mongoose.Types.ObjectId.isValid(req.query.cityId)) {
            query.cityId = new mongoose.Types.ObjectId(req.query.cityId);
        } else if (req.query.location && req.query.location !== 'all') {
             query.$or = [
                { address: { $regex: req.query.location, $options: 'i' } },
                { neighborhood: { $regex: req.query.location, $options: 'i' } }
             ];
        }

        // 4. Price Range
        const minPrice = parseFloat(req.query.minPrice);
        const maxPrice = parseFloat(req.query.maxPrice);
        if (!isNaN(minPrice) || !isNaN(maxPrice)) {
            query.price = {};
            if (!isNaN(minPrice)) query.price.$gte = minPrice;
            if (!isNaN(maxPrice)) query.price.$lte = maxPrice;
        }

        // 5. Bedrooms & Bathrooms
        if (req.query.bedrooms && req.query.bedrooms !== 'any') {
            const val = parseInt(req.query.bedrooms);
            if (!isNaN(val)) query.bedrooms = { $gte: val };
        }
        if (req.query.bathrooms && req.query.bathrooms !== 'any') {
            const val = parseInt(req.query.bathrooms);
            if (!isNaN(val)) query.bathrooms = { $gte: val };
        }

        // 6. Square Feet
        const sMin = parseFloat(req.query.sqftMin);
        const sMax = parseFloat(req.query.sqftMax);
        if (!isNaN(sMin) || !isNaN(sMax)) {
            query.size = {};
            if (!isNaN(sMin)) query.size.$gte = sMin;
            if (!isNaN(sMax)) query.size.$lte = sMax;
        }

        // 7. Year Built
        const yMin = parseInt(req.query.yearMin);
        const yMax = parseInt(req.query.yearMax);
        if (!isNaN(yMin) || !isNaN(yMax)) {
            query.yearBuilt = {};
            if (!isNaN(yMin)) query.yearBuilt.$gte = yMin;
            if (!isNaN(yMax)) query.yearBuilt.$lte = yMax;
        }

        // 8. Keyword Search (Property Name)
        if (req.query.q) {
            query.title = { $regex: req.query.q, $options: 'i' };
        }

        const total = await Property.countDocuments(query);
        const properties = await Property.find(query)
            .populate('categoryId', 'name')
            .populate('seller', 'name profileImage')
            .populate('countryId', 'name')
            .populate('stateId', 'name')
            .populate('cityId', 'name')
            .populate('amenities', 'name')
            .sort(sortObj)
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            properties,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching properties', error: err.message });
    }
};

exports.getMyProperties = async (req, res) => {
    try {
        let query = {};
        if (req.user.userType === 'superadmin') {
            // Superadmin can see everything
        } else if (req.user.userType === 'seller') {
            query.seller = req.user._id;
        } else {
            return res.status(403).json({ message: 'Access denied' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await Property.countDocuments(query);
        const properties = await Property.find(query)
            .populate('categoryId', 'name')
            .populate('seller', 'name email profileImage')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            properties,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching properties', error: err.message });
    }
};

exports.updatePropertyStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        if (req.user.userType !== 'superadmin') {
            return res.status(403).json({ message: 'Only superadmins can update property status' });
        }

        const property = await Property.findByIdAndUpdate(id, { propertyStatus: status }, { new: true });
        if (!property) return res.status(404).json({ message: 'Property not found' });

        res.status(200).json({ message: 'Property status updated successfully', property });
    } catch (err) {
        res.status(500).json({ message: 'Error updating property status', error: err.message });
    }
};

exports.updateProperty = async (req, res) => {
    try {
        const { id } = req.params;
        const property = await Property.findById(id);
        if (!property) return res.status(404).json({ message: 'Property not found' });

        if (req.user.userType !== 'superadmin' && property.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const updateData = { ...req.body };
        
        // Ensure category and location IDs are properly assigned
        if (req.body.category) updateData.categoryId = req.body.category;
        if (req.body.countryId) updateData.countryId = req.body.countryId;
        if (req.body.stateId) updateData.stateId = req.body.stateId;
        if (req.body.cityId) updateData.cityId = req.body.cityId;

        const updatedProperty = await Property.findByIdAndUpdate(id, updateData, { new: true });
        res.status(200).json({ message: 'Property updated successfully', property: updatedProperty });
    } catch (err) {
        res.status(500).json({ message: 'Error updating property', error: err.message });
    }
};

exports.deleteProperty = async (req, res) => {
    try {
        const { id } = req.params;
        const property = await Property.findById(id);
        if (!property) return res.status(404).json({ message: 'Property not found' });

        if (req.user.userType !== 'superadmin' && property.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await Property.findByIdAndDelete(id);
        res.status(200).json({ message: 'Property deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting property', error: err.message });
    }
};