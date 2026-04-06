const Category = require('../models/Category');
const Property = require('../models/Property');

// Create Category
exports.createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const exists = await Category.findOne({ name });
        if (exists) return res.status(400).json({ message: 'Category already exists' });

        const newCategory = new Category({ name, description, seller: req.user._id });
        await newCategory.save();
        res.status(201).json(newCategory);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get All Categories (with pagination)
exports.getCategories = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let query = {};
        if (req.user && req.user.userType !== 'superadmin') {
            query.seller = req.user._id;
        }

        const categories = await Category.find(query)
            .populate('seller', 'name email profileImage')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Category.countDocuments(query);

        res.status(200).json({
            categories,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalCategories: total
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAllCategories = async (req, res) => {
    try {
        let query = {};
        if (req.user && req.user.userType !== 'superadmin') {
            query.seller = req.user._id;
        }
        const categories = await Category.find(query).sort({ name: 1 });
        res.status(200).json(categories);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Update Category
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        const category = await Category.findById(id);
        if (!category) return res.status(404).json({ message: 'Category not found' });

        if (req.user.userType !== 'superadmin' && category.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this category' });
        }

        category.name = name;
        category.description = description;
        await category.save();

        res.status(200).json(category);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete Category
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findById(id);
        if (!category) return res.status(404).json({ message: 'Category not found' });

        if (req.user.userType !== 'superadmin' && category.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this category' });
        }

        // Check if any property uses this category
        const propertyCount = await Property.countDocuments({ categoryId: id });
        if (propertyCount > 0) {
            return res.status(400).json({ 
                message: `Cannot delete category. There are ${propertyCount} properties assigned to this category.` 
            });
        }

        await Category.findByIdAndDelete(id);

        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};
