/**
 * Fixed system roles for this project.
 * Always upsert Buyer, Seller, and Superadmin.
 *
 * Run manually:
 *   cd backend
 *   node scripts/seedRoles.js
 *
 * Also runs automatically on server start.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const FIXED_ROLES = [
    {
        name: 'superadmin',
        description: 'Full access to all features',
        permissions: ['all'],
        isSystem: true,
        status: true,
    },
    {
        name: 'seller',
        description: 'Can manage own properties',
        permissions: ['properties.manage', 'profile.manage'],
        isSystem: true,
        status: true,
    },
    {
        name: 'buyer',
        description: 'Can browse and save properties',
        permissions: ['properties.view', 'profile.manage'],
        isSystem: true,
        status: true,
    },
];

async function seedDefaultRoles() {
    const Role = require('../models/Role');
    for (const def of FIXED_ROLES) {
        await Role.findOneAndUpdate(
            { name: def.name },
            { $set: def },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    }
    console.log('✅ Fixed roles seeded: buyer, seller, superadmin');
}

module.exports = { FIXED_ROLES, seedDefaultRoles };

if (require.main === module) {
    const mongoose = require('mongoose');
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error('MONGO_URI is missing. Create backend/.env first.');
        process.exit(1);
    }
    mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
        .then(() => seedDefaultRoles())
        .then(() => mongoose.disconnect())
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('Role seed failed:', err.message);
            process.exit(1);
        });
}
