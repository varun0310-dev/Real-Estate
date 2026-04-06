const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
    name: { type: String, required: true },
    stateId: { type: mongoose.Schema.Types.ObjectId, ref: 'State', required: true },
    countryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: true }
}, { timestamps: true });

citySchema.index({ stateId: 1, name: 1 });
citySchema.index({ countryId: 1, name: 1 });

module.exports = mongoose.model('City', citySchema);
