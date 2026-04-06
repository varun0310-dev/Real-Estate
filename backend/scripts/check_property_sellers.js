const mongoose = require('mongoose');
const Property = require('../models/Property');
const User = require('../models/User'); // Required for population
require('dotenv').config();

async function start() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const props = await Property.find({})
            .limit(10)
            .populate('seller', 'name email');
        
        console.log('--- Property Check ---');
        props.forEach(p => {
            console.log(`- Title: ${p.title}`);
            console.log(`  Seller ID: ${p.seller?._id || 'MISSING'}`);
            console.log(`  Seller Name: ${p.seller?.name || 'NULL'}`);
            console.log(`  Seller Email: ${p.seller?.email || 'NULL'}`);
            console.log('--------------------');
        });

        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err);
        process.exit(1);
    }
}

start();
