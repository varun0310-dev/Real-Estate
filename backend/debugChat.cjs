require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function debug() {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const User = require('./models/User');
    const Conversation = require('./models/Conversation');
    const Property = require('./models/Property');

    // Find admin(s)
    const admins = await User.find({ userType: 'superadmin' });
    console.log('=== ADMIN USERS ===');
    admins.forEach(a => console.log(`  _id: ${a._id}  name: ${a.name}  email: ${a.email}  userType: ${a.userType}`));

    // Find all properties and their seller field
    const allProps = await Property.find().populate('seller', 'name email userType');
    console.log('\n=== PROPERTIES (seller info) ===');
    allProps.forEach(p => {
        console.log(`  "${p.title}" -> seller._id: ${p.seller?._id}  seller.userType: ${p.seller?.userType}`);
    });

    // Find all conversations
    const allConv = await Conversation.find()
        .populate('propertyId', 'title')
        .populate('buyerId', 'name email')
        .populate('sellerId', 'name email userType');

    console.log('\n=== ALL CONVERSATIONS ===');
    if (allConv.length === 0) {
        console.log('  NONE FOUND IN DATABASE');
    }
    allConv.forEach(c => {
        const adminId = admins[0]?._id?.toString();
        const sellerMatch = c.sellerId?._id?.toString() === adminId;
        console.log(`  Conv: ${c._id}`);
        console.log(`    Property:    ${c.propertyId?.title}`);
        console.log(`    Buyer:       ${c.buyerId?.name} (${c.buyerId?.email})`);
        console.log(`    Seller in DB:${c.sellerId?.name} | userType:${c.sellerId?.userType} | _id:${c.sellerId?._id}`);
        console.log(`    Admin _id:   ${adminId}`);
        console.log(`    sellerId == admin._id? ${sellerMatch}`);
        console.log('');
    });

    await mongoose.disconnect();
}

debug().catch(console.error);
