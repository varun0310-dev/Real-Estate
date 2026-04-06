const mongoose = require('mongoose');
const Property = require('../models/Property');
const Category = require('../models/Category');
const Amenity = require('../models/Amenity');
const User = require('../models/User');
require('dotenv').config();

async function start() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const sellerEmail = process.env.SELLER_EMAIL || 'seller@gmail.com'; // Change this as needed
        const seller = await User.findOne({ email: sellerEmail });

        if (!seller) {
            console.error('Seller not found.');
            process.exit(1);
        }

        console.log(`Checking data for: ${seller.email} (${seller._id})`);

        // 1. Process Categories based on properties
        const myProperties = await Property.find({ seller: seller._id });
        console.log(`Seller owns ${myProperties.length} properties.`);

        const usedCategoryIds = [
            ...new Set(myProperties.map(p => (p.categoryId?._id || p.categoryId)?.toString()))
        ].filter(id => id);

        if (usedCategoryIds.length > 0) {
            const result = await Category.updateMany(
                { _id: { $in: usedCategoryIds } },
                { $set: { seller: seller._id } }
            );
            console.log(`Restored ${result.modifiedCount} categories to ${seller.email}.`);
        }

        // 2. Process Amenities based on properties
        let usedAmenityIds = [];
        myProperties.forEach(p => {
            if (p.amenities && Array.isArray(p.amenities)) {
                p.amenities.forEach(id => usedAmenityIds.push(id.toString()));
            }
        });
        usedAmenityIds = [...new Set(usedAmenityIds)].filter(id => id);

        if (usedAmenityIds.length > 0) {
            const result = await Amenity.updateMany(
                { _id: { $in: usedAmenityIds } },
                { $set: { seller: seller._id } }
            );
            console.log(`Restored ${result.modifiedCount} amenities to ${seller.email}.`);
        }

        console.log('Data restoration finished.');
        process.exit(0);
    } catch (err) {
        console.error('Restoration failed:', err);
        process.exit(1);
    }
}

start();
