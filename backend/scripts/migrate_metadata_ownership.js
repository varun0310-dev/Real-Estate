const mongoose = require('mongoose');
const Category = require('../models/Category');
const Amenity = require('../models/Amenity');
const User = require('../models/User');
require('dotenv').config();

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    const admin = await User.findOne({ email: adminEmail });

    if (!admin) {
        console.error('Super Admin not found. Please run user migration first.');
        process.exit(1);
    }

    const adminId = admin._id;

    // Update Categories without seller
    const catResult = await Category.updateMany(
        { seller: { $exists: false } },
        { $set: { seller: adminId } }
    );
    console.log(`Assigned ${catResult.modifiedCount} orphan categories to Super Admin.`);

    // Update Amenities without seller
    const amResult = await Amenity.updateMany(
        { seller: { $exists: false } },
        { $set: { seller: adminId } }
    );
    console.log(`Assigned ${amResult.modifiedCount} orphan amenities to Super Admin.`);

    console.log('Orphan metadata migration finished.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

start();
