const mongoose = require('mongoose');
const Property = require('../models/Property');
require('dotenv').config();

async function start() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Set all existing properties to 'Approved' so they don't disappear from the site
        const result = await Property.updateMany(
            { propertyStatus: { $exists: false } },
            { $set: { propertyStatus: 'Approved' } }
        );
        console.log(`Updated ${result.modifiedCount} existing properties to 'Approved'.`);

        // Also ensure properties with empty/invalid status are Approved
        const result2 = await Property.updateMany(
            { propertyStatus: { $nin: ['Pending', 'Approved', 'Rejected'] } },
            { $set: { propertyStatus: 'Approved' } }
        );
        console.log(`Updated ${result2.modifiedCount} properties with invalid status to 'Approved'.`);

        process.exit(0);
    } catch (err) {
        console.error('Update failed:', err);
        process.exit(1);
    }
}

start();
