const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
    name: { type: String, required: true },
    isoCode: { type: String, required: true, unique: true },
    phonecode: { type: String },
    currency: { type: String },
    flag: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Country', countrySchema);
