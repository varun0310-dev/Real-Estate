const Country = require('../models/Country');
const State = require('../models/State');
const City = require('../models/City');

exports.getCountries = async (req, res) => {
    try {
        const countries = await Country.find().sort({ name: 1 });
        res.status(200).json(countries);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getStates = async (req, res) => {
    try {
        const { countryId } = req.params;
        const states = await State.find({ countryId }).sort({ name: 1 });
        res.status(200).json(states);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getCities = async (req, res) => {
    try {
        const { stateId } = req.params;
        const cities = await City.find({ stateId }).sort({ name: 1 });
        res.status(200).json(cities);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAllCities = async (req, res) => {
    try {
        const { q } = req.query;
        let query = {};
        if (q) {
            query = { name: { $regex: q, $options: 'i' } };
        }
        
        const cities = await City.find(query)
            .populate('stateId', 'name')
            .populate('countryId', 'name')
            .limit(10)
            .sort({ name: 1 });
            
        res.status(200).json(cities);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getCitiesWithCounts = async (req, res) => {
    try {
        const Property = require('../models/Property');
        
        const counts = await Property.aggregate([
            { $match: { propertyStatus: 'Approved' } },
            { $group: { _id: '$cityId', count: { $sum: 1 } } },
            { 
                $lookup: {
                    from: 'cities',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'cityInfo'
                }
            },
            { $unwind: '$cityInfo' },
            {
                $project: {
                    _id: 1,
                    name: '$cityInfo.name',
                    count: 1
                }
            },
            { $sort: { count: -1 } },
            { $limit: 8 }
        ]);

        res.status(200).json(counts);
    } catch (err) {
        console.error('Aggregation error:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
