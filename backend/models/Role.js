const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    permissions: [{
        type: String,
        trim: true
    }],
    isSystem: {
        type: Boolean,
        default: false  // true for built-in roles (superadmin, buyer, seller) that can't be deleted
    },
    status: {
        type: Boolean,
        default: true  // true = active, false = inactive
    }
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
