const mongoose = require('mongoose');
const Property = require('../models/Property');
const City = require('../models/City');
const State = require('../models/State');
const Country = require('../models/Country');
require('dotenv').config();

async function deduplicate(Model, idFieldInProperty, parentField = null) {
  const allDocs = await Model.find({});
  const groups = {};

  allDocs.forEach(doc => {
    // Group by name + parentId (if it exists)
    const key = parentField ? `${doc.name.toLowerCase()}_${doc[parentField]}` : doc.name.toLowerCase();
    if (!groups[key]) groups[key] = [];
    groups[key].push(doc);
  });

  for (const key in groups) {
    const group = groups[key];
    if (group.length > 1) {
      console.log(`Found ${group.length} duplicates for ${key}`);
      const target = group[0];
      const duplicates = group.slice(1);
      const duplicateIds = duplicates.map(d => d._id);

      // Update properties
      const updateFilter = {};
      updateFilter[idFieldInProperty] = { $in: duplicateIds };
      
      const updateData = {};
      updateData[idFieldInProperty] = target._id;

      const updateResult = await Property.updateMany(updateFilter, updateData);
      console.log(`- Updated ${updateResult.modifiedCount} properties to use ${target.name} (${target._id})`);

      // Delete duplicates
      await Model.deleteMany({ _id: { $in: duplicateIds } });
      console.log(`- Deleted ${duplicates.length} duplicate records.`);
    }
  }
}

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    console.log('Deduplicating Countries...');
    await deduplicate(Country, 'countryId');

    console.log('Deduplicating States...');
    await deduplicate(State, 'stateId', 'countryId');

    console.log('Deduplicating Cities...');
    await deduplicate(City, 'cityId', 'stateId');

    console.log('Finished deduplication.');
    process.exit(0);
  } catch (err) {
    console.error('Error during deduplication:', err);
    process.exit(1);
  }
}

start();
