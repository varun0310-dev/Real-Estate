const mongoose = require('mongoose');

const PLANS = {
    basic: {
        name: 'Basic (Free)',
        durationDays: 30,
        monthlyPrice: 0,
        annualPrice: null,
        visibility: 'Standard',
        visibilityBoostDays: 0,
        visibilityBoostMultiplier: 1,
        maxListingsAnnual: null, // single listing only
    },
    standard: {
        name: 'Standard (Verified)',
        durationDays: 60,
        monthlyPrice: 2999,
        annualPrice: 7499,
        visibility: '2x Boost (7 Days)',
        visibilityBoostDays: 7,
        visibilityBoostMultiplier: 2,
        maxListingsAnnual: 3,
    },
    premium: {
        name: 'Premium (Gold)',
        durationDays: 90,
        monthlyPrice: 6999,
        annualPrice: 15999,
        visibility: '5x Boost (15 Days)',
        visibilityBoostDays: 15,
        visibilityBoostMultiplier: 5,
        maxListingsAnnual: 5,
    },
};

const subscriptionSchema = new mongoose.Schema({
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    plan: {
        type: String,
        enum: ['basic', 'standard', 'premium'],
        default: 'basic',
    },
    billingCycle: {
        type: String,
        enum: ['monthly', 'annual'],
        default: 'monthly',
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'cancelled'],
        default: 'active',
    },
    startDate: {
        type: Date,
        default: Date.now,
    },
    expiryDate: {
        type: Date,
        required: true,
    },
    // Notification flags
    expiryEmailSent: {
        type: Boolean,
        default: false,
    },
    // Price paid (0 for basic)
    amountPaid: {
        type: Number,
        default: 0,
    },
    couponCode: {
        type: String,
        default: null,
        trim: true,
        uppercase: true,
    },
}, { timestamps: true });

// Virtual: is currently active
subscriptionSchema.virtual('isActive').get(function () {
    return this.status === 'active' && this.expiryDate > new Date();
});

subscriptionSchema.set('toJSON', { virtuals: true });
subscriptionSchema.set('toObject', { virtuals: true });

subscriptionSchema.statics.PLANS = PLANS;

module.exports = mongoose.model('Subscription', subscriptionSchema);
