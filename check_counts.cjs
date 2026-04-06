const mongoose = require('mongoose');

async function checkCounts() {
    try {
        await mongoose.connect('mongodb://localhost:27017/real_estate');
        const db = mongoose.connection.db;

        const countries = await db.collection('countries').countDocuments();
        const states = await db.collection('states').countDocuments();
        const cities = await db.collection('cities').countDocuments();

        console.log(`Countries: ${countries}`);
        console.log(`States: ${states}`);
        console.log(`Cities: ${cities}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkCounts();
