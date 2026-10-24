const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: [true, 'Coupon title is required'],
        unique: true,
        trim: true,
        uppercase: true // Enforce uppercase for coupon codes
    },
    sellerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: [true, 'Seller selection is required']
    },
    discountType: { 
        type: String, 
        enum: {
            values: ['fixed', 'percentage'],
            message: 'Discount type must be either fixed or percentage'
        },
        required: [true, 'Discount type is required']
    },
    discountValue: { 
        type: Number, 
        required: [true, 'Discount value is required'],
        min: [1, 'Discount value must be at least 1']
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    usageCount: {
        type: Number,
        default: 0
    },
    expiresAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

// Pre-save validation for percentage type
couponSchema.pre('save', function(next) {
    if (this.discountType === 'percentage' && this.discountValue > 100) {
        return next(new Error('Percentage discount cannot exceed 100'));
    }
    next();
});

module.exports = mongoose.model('Coupon', couponSchema);
