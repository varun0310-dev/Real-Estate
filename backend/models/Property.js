const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    propertyType: String,
    propertyStatus: { 
        type: String, 
        enum: ['Pending', 'Approved', 'Rejected'], 
        default: 'Pending' 
    },
    price: { type: Number },
    yearlyTaxRate: String,
    afterPriceLabel: String,
    address: String,
    zip: String,
    neighborhood: String,
    latitude: String,
    longitude: String,
    size: Number,
    lotSize: Number,
    bedrooms: Number,
    bathrooms: Number,
    yearBuilt: Number,
    garages: Number,
    countryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Country' },
    stateId: { type: mongoose.Schema.Types.ObjectId, ref: 'State' },
    cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
    images: [String],
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Residential Fields
    propertyDimensions: String,
    noOfBedrooms: Number,
    noOfBathrooms: Number,
    balconies: Number,
    coveredParking: Number,
    openParking: Number,
    otherRooms: [String], // pooja, study, servant, store
    furnishing: { type: String, enum: ['fully furnished', 'semi furnished', 'unfurnished'] },
    builtUpFloors: Number,
    amenities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Amenity' }],
    features: [String], // medium height, modular kitchen, etc.

    // Commercial Fields
    officeDimensions: String,
    officeType: { type: String, enum: ['ready to move', 'bareshell', 'co working'] },
    pantryType: { type: String, enum: ['shared', 'non shared'] },
    washroom: { type: String, enum: ['public', 'private', 'not available'] },
    parkingType: { type: String, enum: ['public', 'private', 'multi-level', 'not available'] },
    lifts: Number,
    staircases: Number,
    state: { type: Number, enum: [0, 1], default: 1 },

}, { timestamps: true });

module.exports = mongoose.model('Property', propertySchema);