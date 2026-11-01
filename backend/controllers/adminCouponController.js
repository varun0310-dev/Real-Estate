const Coupon = require('../models/Coupon');
const User = require('../models/User');

// Create a new coupon (supports Referral Program & general coupons)
exports.createCoupon = async (req, res) => {
    try {
        const {
            title,
            sellerId,
            couponType = 'referral',
            discountType,
            discountValue,
            applicablePlans,
            minPurchaseAmount,
            maxUses,
            maxUsesPerSeller,
            expiresAt,
        } = req.body;

        if (!title || !sellerId || !discountType || !discountValue) {
            return res.status(400).json({ message: 'Title, seller, discount type and value are required.' });
        }

        const cleanTitle = title.trim().toUpperCase();
        const existingCoupon = await Coupon.findOne({ title: cleanTitle });
        if (existingCoupon) {
            return res.status(400).json({ message: 'Coupon title already exists. Please use a unique title.' });
        }

        const coupon = new Coupon({
            title: cleanTitle,
            sellerId,
            couponType: couponType || 'referral',
            discountType,
            discountValue: Number(discountValue),
            applicablePlans: Array.isArray(applicablePlans) && applicablePlans.length > 0
                ? applicablePlans
                : ['standard', 'premium'],
            minPurchaseAmount: Number(minPurchaseAmount) || 0,
            maxUses: maxUses ? Number(maxUses) : null,
            maxUsesPerSeller: maxUsesPerSeller ? Math.max(1, Number(maxUsesPerSeller)) : 1,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
        });

        await coupon.save();
        await coupon.populate('sellerId', 'name email companyName');

        res.status(201).json({ message: 'Coupon created successfully', coupon });
    } catch (err) {
        console.error('Create coupon error:', err);
        if (err.message) {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all coupons with pagination & populated referrer / usage info
exports.getCoupons = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await Coupon.countDocuments();
        const coupons = await Coupon.find()
            .populate('sellerId', 'name email companyName')
            .populate('usedBy.seller', 'name email companyName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            coupons,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total,
        });
    } catch (err) {
        console.error('Get coupons error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update a coupon
exports.updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            sellerId,
            couponType,
            discountType,
            discountValue,
            applicablePlans,
            minPurchaseAmount,
            maxUses,
            maxUsesPerSeller,
            expiresAt,
        } = req.body;

        const coupon = await Coupon.findById(id);
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        if (coupon.usageCount > 0) {
            return res.status(400).json({ message: 'Cannot edit coupon because it is already in use.' });
        }

        if (title && title.trim().toUpperCase() !== coupon.title) {
            const cleanTitle = title.trim().toUpperCase();
            const existingCoupon = await Coupon.findOne({ title: cleanTitle });
            if (existingCoupon) {
                return res.status(400).json({ message: 'Coupon title already exists. Please use a unique title.' });
            }
            coupon.title = cleanTitle;
        }

        if (sellerId) coupon.sellerId = sellerId;
        if (couponType) coupon.couponType = couponType;
        if (discountType) coupon.discountType = discountType;
        if (discountValue) coupon.discountValue = Number(discountValue);
        if (applicablePlans !== undefined) {
            coupon.applicablePlans = Array.isArray(applicablePlans) && applicablePlans.length > 0
                ? applicablePlans
                : ['standard', 'premium'];
        }
        if (minPurchaseAmount !== undefined) coupon.minPurchaseAmount = Number(minPurchaseAmount) || 0;
        if (maxUses !== undefined) coupon.maxUses = maxUses ? Number(maxUses) : null;
        if (maxUsesPerSeller !== undefined) coupon.maxUsesPerSeller = maxUsesPerSeller ? Math.max(1, Number(maxUsesPerSeller)) : 1;
        if (expiresAt !== undefined) {
            coupon.expiresAt = expiresAt ? new Date(expiresAt) : null;
        }

        await coupon.save();
        await coupon.populate('sellerId', 'name email companyName');

        res.status(200).json({ message: 'Coupon updated successfully', coupon });
    } catch (err) {
        console.error('Update coupon error:', err);
        if (err.message) {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a coupon
exports.deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;

        const coupon = await Coupon.findById(id);
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        if (coupon.usageCount > 0) {
            return res.status(400).json({ message: 'Cannot delete coupon because it is already in use.' });
        }

        await Coupon.findByIdAndDelete(id);
        res.status(200).json({ message: 'Coupon deleted successfully' });
    } catch (err) {
        console.error('Delete coupon error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Toggle status
exports.toggleCouponStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findById(id);

        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        coupon.status = coupon.status === 'active' ? 'inactive' : 'active';
        await coupon.save();

        res.status(200).json({ message: 'Coupon status updated successfully', coupon });
    } catch (err) {
        console.error('Toggle coupon status error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all sellers for the dropdown
exports.getSellersList = async (req, res) => {
    try {
        const sellers = await User.find({ userType: 'seller' }).select('name email companyName');
        res.status(200).json({ sellers });
    } catch (err) {
        console.error('Get sellers error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
