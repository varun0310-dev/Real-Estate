const mongoose = require('mongoose');

/**
 * PackageSetting – stores admin-configurable plan details.
 * One document per plan key (basic, standard, premium).
 * Super admin can update these; frontend fetches them dynamically.
 */
const packageSettingSchema = new mongoose.Schema({
    planKey: {
        type: String,
        enum: ['basic', 'standard', 'premium'],
        required: true,
        unique: true,
    },
    name: { type: String, required: true },
    badge: { type: String, default: '' },
    durationDays: { type: Number, required: true },
    monthlyPrice: { type: Number, default: 0 },
    annualPrice: { type: Number, default: null },
    maxProperties: {
        type: Number,
        default: null, // null = unlimited
    },
    maxPropertiesAnnual: {
        type: Number,
        default: null, // null = unlimited
    },
    visibilityBoostDays: { type: Number, default: 0 },
    visibilityBoostMultiplier: { type: Number, default: 1 },
    visibility: { type: String, default: 'Standard' },
    features: [{ text: String, included: Boolean }],
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('PackageSetting', packageSettingSchema);
