/**
 * Debug script - run once to check what sellerId is stored in Conversations
 * and compare it to the admin user's _id.
 * 
 * Run with: node backend/scripts/debugChat.js
 */

require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function debug() {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const User = require('./backend/models/User');
    const Conversation = require('./backend/models/Conversation');
    const Property = require('./backend/models/Property');

    // Find admin
    const admin = await User.findOne({ userType: 'superadmin' });
    console.log('\n=== ADMIN USER ===');
    console.log('_id:', admin?._id?.toString());
    console.log('name:', admin?.name);
    console.log('email:', admin?.email);
    console.log('userType:', admin?.userType);

    // Find properties posted by admin
    const adminProperties = await Property.find({ seller: admin?._id });
    console.log('\n=== ADMIN PROPERTIES ===');
    adminProperties.forEach(p => {
        console.log(`  - ${p.title} | seller: ${p.seller?.toString()}`);
    });

    // Find all conversations
    const allConversations = await Conversation.find()
        .populate('propertyId', 'title')
        .populate('buyerId', 'name email')
        .populate('sellerId', 'name email userType');
    
    console.log('\n=== ALL CONVERSATIONS ===');
    if (allConversations.length === 0) {
        console.log('  No conversations found in DB at all!');
    }
    allConversations.forEach(c => {
        console.log(`  Conv _id: ${c._id}`);
        console.log(`    Property: ${c.propertyId?.title}`);
        console.log(`    Buyer: ${c.buyerId?.name} (${c.buyerId?.email})`);
        console.log(`    Seller: ${c.sellerId?.name} (${c.sellerId?.email}) | userType: ${c.sellerId?.userType}`);
        console.log(`    sellerId in DB: ${c.sellerId?._id?.toString()}`);
        console.log(`    Admin _id:      ${admin?._id?.toString()}`);
        console.log(`    Match: ${c.sellerId?._id?.toString() === admin?._id?.toString()}`);
        console.log('');
    });

    mongoose.disconnect();
}

debug().catch(console.error);
