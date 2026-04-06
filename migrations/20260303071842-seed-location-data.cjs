const { Country, State, City } = require('country-state-city');

module.exports = {
  async up(db, client) {
    const countriesColl = db.collection('countries');
    const statesColl = db.collection('states');
    const citiesColl = db.collection('cities');

    // 1. Seed All Countries
    console.log('Fetching all countries...');
    const allCountries = Country.getAllCountries().map(c => ({
      name: c.name,
      isoCode: c.isoCode,
      phonecode: c.phonecode,
      currency: c.currency,
      flag: c.flag,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    await countriesColl.insertMany(allCountries);
    console.log(`Inserted ${allCountries.length} countries.`);

    // 2. Map Country ISO to DB _id
    const dbCountries = await countriesColl.find({}).toArray();
    const countryMap = {};
    dbCountries.forEach(c => { countryMap[c.isoCode] = c._id; });

    // 3. Seed All States
    console.log('Fetching all states...');
    const allStates = State.getAllStates().map(s => ({
      name: s.name,
      isoCode: s.isoCode,
      countryId: countryMap[s.countryCode],
      createdAt: new Date(),
      updatedAt: new Date(),
    })).filter(s => s.countryId); // Ensure country exists in DB

    await statesColl.insertMany(allStates);
    console.log(`Inserted ${allStates.length} states.`);

    // 4. Map State ISO + Country Code to DB _id
    const dbStates = await statesColl.find({}).toArray();
    const stateMap = {};
    dbStates.forEach(s => {
      const countryCode = dbCountries.find(c => c._id.equals(s.countryId)).isoCode;
      stateMap[`${countryCode}-${s.isoCode}`] = s._id;
    });

    // 5. Seed Cities (Limited to save time/memory, or use all)
    // Seeding ALL cities (150k+) in one go might be slow.
    // We'll seed all for a comprehensive experience, but in chunks if needed.
    // For this migration, we'll try all. If it fails, we'll limit it.
    console.log('Fetching all cities (this may take a few seconds)...');
    const allCities = City.getAllCities().map(c => ({
      name: c.name,
      stateId: stateMap[`${c.countryCode}-${c.stateCode}`],
      countryId: countryMap[c.countryCode],
      createdAt: new Date(),
      updatedAt: new Date(),
    })).filter(c => c.stateId && c.countryId);

    // Insert in chunks of 10,000
    const CHUNK_SIZE = 10000;
    for (let i = 0; i < allCities.length; i += CHUNK_SIZE) {
      const chunk = allCities.slice(i, i + CHUNK_SIZE);
      await citiesColl.insertMany(chunk);
      console.log(`Inserted cities chunk ${i / CHUNK_SIZE + 1}...`);
    }
    console.log(`Inserted ${allCities.length} cities total.`);
  },

  async down(db, client) {
    await db.collection('countries').deleteMany({});
    await db.collection('states').deleteMany({});
    await db.collection('cities').deleteMany({});
    console.log('Location data rolled back.');
  }
};
