const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    subscription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscription',
        default: null,
    },
    // Razorpay identifiers
    razorpayOrderId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    razorpayPaymentId: {
        type: String,
        default: null,
        sparse: true,
    },
    razorpaySignature: {
        type: String,
        default: null,
    },
    // Plan details snapshot (frozen at payment time)
    plan: {
        type: String,
        enum: ['basic', 'standard', 'premium'],
        required: true,
    },
    planName: {
        type: String,
        required: true,
    },
    billingCycle: {
        type: String,
        enum: ['monthly', 'annual'],
        default: 'monthly',
    },
    // Amounts in INR (rupees, not paise)
    baseAmount: {
        type: Number,
        required: true,
    },
    discountAmount: {
        type: Number,
        default: 0,
    },
    finalAmount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        default: 'INR',
    },
    // Coupon info snapshot
    couponCode: {
        type: String,
        default: null,
        trim: true,
        uppercase: true,
    },
    couponDiscountType: {
        type: String,
        enum: ['fixed', 'percentage', null],
        default: null,
    },
    couponDiscountValue: {
        type: Number,
        default: null,
    },
    // Payment status
    status: {
        type: String,
        enum: ['created', 'paid', 'failed', 'refunded'],
        default: 'created',
        index: true,
    },
    // Invoice number (auto-generated)
    invoiceNumber: {
        type: String,
        unique: true,
        sparse: true,
    },
    paidAt: {
        type: Date,
        default: null,
    },
    // Extra metadata
    receipt: String,
    notes: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

// Auto-generate invoice number before save
paymentSchema.pre('save', async function (next) {
    if (!this.invoiceNumber && this.status === 'paid') {
        const year = new Date().getFullYear();
        const count = await mongoose.model('Payment').countDocuments({
            invoiceNumber: { $ne: null },
            createdAt: {
                $gte: new Date(`${year}-01-01`),
                $lt: new Date(`${year + 1}-01-01`),
            },
        });
        this.invoiceNumber = `INV-${year}-${String(count + 1).padStart(5, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Payment', paymentSchema);
