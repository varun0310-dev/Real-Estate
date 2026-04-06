const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function start() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Ensure all superadmin roles have superadmin userType
        const result = await User.updateMany(
            { role: 'superadmin' },
            { $set: { userType: 'superadmin' } }
        );
        console.log(`Updated ${result.modifiedCount} superadmins to userType: 'superadmin'.`);

        // Also ensure any specific admin@gmail.com is superadmin
        const result2 = await User.updateMany(
            { email: 'admin@gmail.com' },
            { $set: { role: 'superadmin', userType: 'superadmin' } }
        );
        console.log(`Ensured admin@gmail.com has full superadmin privileges.`);

        process.exit(0);
    } catch (err) {
        console.error('Update failed:', err);
        process.exit(1);
    }
}

start();
