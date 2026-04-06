const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    // 1. Ensure Super Admin exists with correct userType and role
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
        console.log(`Creating superadmin (${adminEmail})...`);
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        admin = new User({
            name: 'Super',
            lastname: 'Admin',
            email: adminEmail,
            password: hashedPassword,
            isVerified: true,
            userType: 'superadmin',
            role: 'superadmin'
        });
        await admin.save();
    } else {
        console.log(`Updating ${adminEmail} to have superadmin Type/Role...`);
        admin.userType = 'superadmin';
        admin.role = 'superadmin';
        await admin.save();
    }

    // 2. Set role: 'superadmin' only for userType: 'superadmin'
    const adminRoleUpdate = await User.updateMany(
        { userType: 'superadmin' },
        { $set: { role: 'superadmin' } }
    );
    console.log(`Verified 'superadmin' role for ${adminRoleUpdate.modifiedCount} accounts.`);

    // 3. Set role: 'user' for all other userType
    const userRoleUpdate = await User.updateMany(
        { userType: { $ne: 'superadmin' } },
        { $set: { role: 'user' } }
    );
    console.log(`Downgraded ${userRoleUpdate.modifiedCount} other users to 'user' role.`);

    console.log('RBAC Migration successfully finished.');
    process.exit(0);
  } catch (err) {
    console.error('Migration crashed:', err);
    process.exit(1);
  }
}

start();
