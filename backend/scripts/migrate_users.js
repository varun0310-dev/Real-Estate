const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function runMigration() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    
    // 1. Update all users to have 'user' role except the super admin
    const result = await User.updateMany(
      { email: { $ne: adminEmail } },
      { $set: { role: 'user' } }
    );
    console.log(`- Set role: 'user' for ${result.modifiedCount} users.`);

    // 2. Ensure super admin has the right role
    const adminResult = await User.updateOne(
      { email: adminEmail },
      { $set: { role: 'superadmin' } }
    );
    if (adminResult.modifiedCount > 0) {
      console.log('- Verified superadmin role for the administrator account.');
    }

    console.log('User table migration finished.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
