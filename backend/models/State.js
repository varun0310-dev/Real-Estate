const mongoose = require('mongoose');

const stateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    isoCode: { type: String, required: true },
    countryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: true }
}, { timestamps: true });

stateSchema.index({ countryId: 1, name: 1 });

module.exports = mongoose.model('State', stateSchema);
