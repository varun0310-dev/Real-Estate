const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const test = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("SUCCESS: Connected to MongoDB");
        const count = await User.countDocuments();
        console.log("User count:", count);
        const admin = await User.findOne({ role: 'superadmin' });
        console.log("Admin found:", admin ? admin.email : "NO");
        process.exit(0);
    } catch (err) {
        console.error("FAILURE:", err.message);
        process.exit(1);
    }
};

test();
