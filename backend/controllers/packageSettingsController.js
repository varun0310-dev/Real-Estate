const PackageSetting = require('../models/PackageSetting');
const {
    normalizeFeatures,
    featuresNeedRepair,
    serializePackage,
} = require('../utils/normalizePackageFeatures');

// Default seed data — run once on startup
const DEFAULT_PACKAGES = [
    {
        planKey: 'basic',
        name: 'Basic',
        badge: 'Free',
        durationDays: 30,
        monthlyPrice: 0,
        annualPrice: null,
        maxProperties: 1,
        maxPropertiesAnnual: 1,
        visibilityBoostDays: 0,
        visibilityBoostMultiplier: 1,
        visibility: 'Standard',
        features: [
            { text: '30-Day Active Listing', included: true },
            { text: 'Standard Visibility', included: true },
            { text: '1 Property Listing', included: true },
            { text: 'Basic Analytics', included: true },
            { text: 'Visibility Boost', included: false },
            { text: 'Priority Support', included: false },
            { text: 'Multiple Listings', included: false },
        ],
    },
    {
        planKey: 'standard',
        name: 'Standard',
        badge: 'Verified',
        durationDays: 60,
        monthlyPrice: 2999,
        annualPrice: 7499,
        maxProperties: 3,
        maxPropertiesAnnual: 3,
        visibilityBoostDays: 7,
        visibilityBoostMultiplier: 2,
        visibility: '2x Boost (7 Days)',
        features: [
            { text: '60-Day Active Listing', included: true },
            { text: '2x Visibility Boost', included: true },
            { text: '3 Listings/Year (Annual)', included: true },
            { text: 'Advanced Analytics', included: true },
            { text: '7-Day Boost Window', included: true },
            { text: 'Priority Support', included: true },
            { text: 'Verified Badge', included: true },
        ],
    },
    {
        planKey: 'premium',
        name: 'Premium',
        badge: 'Gold',
        durationDays: 90,
        monthlyPrice: 6999,
        annualPrice: 14999,
        maxProperties: 10,
        maxPropertiesAnnual: 10,
        visibilityBoostDays: 15,
        visibilityBoostMultiplier: 5,
        visibility: '5x Boost (15 Days)',
        features: [
            { text: '90-Day Active Listing', included: true },
            { text: '5x Visibility Boost', included: true },
            { text: 'Unlimited Listings', included: true },
            { text: 'Premium Analytics', included: true },
            { text: '15-Day Boost Window', included: true },
            { text: 'Dedicated Support', included: true },
            { text: 'Gold Badge', included: true },
        ],
    },
];

/**
 * Seed default package settings if not already present.
 * Called on server startup.
 */
const seedPackageSettings = async () => {
    try {
        for (const pkg of DEFAULT_PACKAGES) {
            await PackageSetting.findOneAndUpdate(
                { planKey: pkg.planKey },
                { $setOnInsert: pkg },
                { upsert: true, new: true }
            );

            const existing = await PackageSetting.findOne({ planKey: pkg.planKey });
            if (existing && featuresNeedRepair(existing.features)) {
                await PackageSetting.updateOne(
                    { planKey: pkg.planKey },
                    { $set: { features: pkg.features } }
                );
                console.log(`🔧 Repaired features for plan: ${pkg.planKey}`);
            }
        }
        console.log('✅ Package settings seeded/verified');
    } catch (err) {
        console.error('❌ Package settings seed error:', err.message);
    }
};

/**
 * GET /api/package-settings   — Public: anyone can read plan info
 */
const getPackageSettings = async (req, res) => {
    try {
        const packages = await PackageSetting.find({ isActive: true }).sort({ monthlyPrice: 1 });
        res.status(200).json({ packages: packages.map(serializePackage) });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/**
 * GET /api/package-settings/all   — SuperAdmin: get all (including inactive)
 */
const getAllPackageSettings = async (req, res) => {
    try {
        const packages = await PackageSetting.find().sort({ monthlyPrice: 1 });
        res.status(200).json({ packages: packages.map(serializePackage) });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/**
 * PUT /api/package-settings/:planKey   — SuperAdmin only: update a plan
 */
const updatePackageSetting = async (req, res) => {
    try {
        const { planKey } = req.params;
        const allowedFields = [
            'name', 'badge', 'durationDays', 'monthlyPrice', 'annualPrice',
            'maxProperties', 'maxPropertiesAnnual',
            'visibilityBoostDays', 'visibilityBoostMultiplier', 'visibility',
            'features', 'isActive'
        ];

        const updates = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        if (updates.features !== undefined) {
            updates.features = normalizeFeatures(updates.features);
        }

        const updated = await PackageSetting.findOneAndUpdate(
            { planKey },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ message: 'Package plan not found' });
        }

        res.status(200).json({
            message: 'Package settings updated successfully',
            package: serializePackage(updated),
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = {
    seedPackageSettings,
    getPackageSettings,
    getAllPackageSettings,
    updatePackageSetting,
};
