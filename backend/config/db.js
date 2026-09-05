const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected");

        // Auto-create Super Admin
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

        const existingAdmin = await User.findOne({ email: adminEmail });

        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash(adminPassword, 10);

            const adminUser = new User({
                name: 'Super',
                lastname: 'Admin',
                email: adminEmail,
                password: hashedPassword,
                isVerified: true,
                role: 'superadmin',
                userType: 'superadmin',
            });

            await adminUser.save();
            console.log('Super Admin created successfully');
        } else {
            console.log('Super Admin already exists');
        }
    } catch (err) {
        console.error("DB Connection Failed:", err.message);
        process.exit(1);
    }
};

module.exports = connectDB;