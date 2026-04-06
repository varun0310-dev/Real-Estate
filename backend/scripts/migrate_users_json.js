const mongoose = require('mongoose');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const filePath = path.join(__dirname, '../debug_users.json');
    if (!fs.existsSync(filePath)) {
      console.log('debug_users.json not found. Exiting.');
      process.exit(0);
    }

    const jsonUsers = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`Found ${jsonUsers.length} users in JSON.`);

    for (const jsonUser of jsonUsers) {
        const { _id, __v, createdAt, updatedAt, ...userData } = jsonUser;
        const targetId = new mongoose.Types.ObjectId(_id);

        // 1. Try to find by ID
        let existingUser = await User.findById(targetId);
        
        if (existingUser) {
            console.log(`User found by ID: ${existingUser.email}. Updating to ${userData.email}...`);
            await User.findByIdAndUpdate(targetId, userData);
        } else {
            // 2. Try to find by Email
            existingUser = await User.findOne({ email: userData.email });
            if (existingUser) {
                console.log(`User with email ${userData.email} already exists (different ID). Updating record...`);
                await User.updateOne({ email: userData.email }, userData);
            } else {
                console.log(`Creating user ${userData.email} with ID ${_id}...`);
                await User.create({ _id: targetId, ...userData });
            }
        }
    }

    console.log('User JSON migration successfully finished.');
    process.exit(0);
  } catch (err) {
    console.error('Migration crashed:', err);
    process.exit(1);
  }
}

start();
