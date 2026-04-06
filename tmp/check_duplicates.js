const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const State = require('../backend/models/State');

async function checkDuplicates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const punjabs = await State.find({ name: /Punjab/i });
    console.log('Punjab records found:', punjabs.length);
    punjabs.forEach(p => console.log(`- ID: ${p._id}, Country: ${p.countryId}`));

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkDuplicates();
