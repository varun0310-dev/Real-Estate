const mongoose = require('mongoose');
const { Country: CSC_Country, State: CSC_State, City: CSC_City } = require('country-state-city');
const dotenv = require('dotenv');
const Country = require('../models/Country');
const State = require('../models/State');
const City = require('../models/City');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/real_estate';

const seed = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing data (optional, but good for local dev)
        await Country.deleteMany({});
        await State.deleteMany({});
        await City.deleteMany({});
        console.log('Cleared existing location data');

        // 1. Seed India and maybe USA/UK for variety
        const countriesToSeed = CSC_Country.getAllCountries().filter(c =>
            ['IN', 'US', 'GB', 'AE', 'CA'].includes(c.isoCode)
        );

        console.log('Seeding countries...');
        const savedCountries = [];
        for (const c of countriesToSeed) {
            const country = new Country({
                name: c.name,
                isoCode: c.isoCode,
                phonecode: c.phonecode,
                currency: c.currency,
                flag: c.flag
            });
            await country.save();
            savedCountries.push({ dbId: country._id, iso: c.isoCode, name: c.name });
        }
        console.log(`Seeded ${savedCountries.length} countries`);

        // 2. Seed States for India (and others if needed)
        console.log('Seeding states...');
        const stateMap = {}; // isoCode -> dbId
        for (const sc of savedCountries) {
            const states = CSC_State.getStatesOfCountry(sc.iso);
            for (const s of states) {
                const state = new State({
                    name: s.name,
                    isoCode: s.isoCode,
                    countryId: sc.dbId
                });
                await state.save();
                stateMap[`${sc.iso}-${s.isoCode}`] = state._id;
            }
        }
        console.log('Seeded states');

        // 3. Seed Cities for India (limited to keep it fast)
        console.log('Seeding Indian cities...');
        const india = savedCountries.find(c => c.iso === 'IN');
        if (india) {
            const indiaStates = CSC_State.getStatesOfCountry('IN');
            for (const s of indiaStates) {
                const cities = CSC_City.getCitiesOfState('IN', s.isoCode);
                const cityData = cities.map(c => ({
                    name: c.name,
                    stateId: stateMap[`IN-${s.isoCode}`],
                    countryId: india.dbId
                }));
                if (cityData.length > 0) {
                    await City.insertMany(cityData);
                }
            }
        }
        console.log('Seeded Indian cities');

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

seed();
