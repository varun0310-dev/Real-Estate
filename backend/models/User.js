const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    lastname: { type: String, required: false, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, minlength: 6 },
    googleId: { type: String, unique: true, sparse: true },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    isVerified: { type: Boolean, default: false },
    otp: String,
    otpExpiresAt: Date,
    refreshToken: String,
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,

    // Profile Fields
    phone: String,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    profileImage: String,
    about: String,
    status: {
        type: Boolean,
        default: true, // true = active, false = inactive
    },

    userType: {
        type: String,
        enum: ['buyer', 'seller', 'superadmin'],
        default: 'buyer',
    },

    role: {
        type: String,
        enum: ['user', 'superadmin'],
        default: 'user',
    },

    // Seller Fields
    companyName: String,
    licenseNumber: String,

    // Geo Location - GeoJSON
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            index: '2dsphere',
            default: undefined
        }
    },

    // Activity tracking
    recentSearches: { type: Array, default: [] },
    recentViews: { type: Array, default: [] }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);