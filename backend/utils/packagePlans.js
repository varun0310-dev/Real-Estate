const PackageSetting = require('../models/PackageSetting');

/** Fallback when DB has no package settings yet */
const FALLBACK_PLANS = {
    basic: {
        name: 'Basic (Free)',
        badge: 'Free',
        durationDays: 30,
        monthlyPrice: 0,
        annualPrice: null,
        visibility: 'Standard',
        visibilityBoostDays: 0,
        visibilityBoostMultiplier: 1,
        maxProperties: 1,
        maxListingsAnnual: null,
        features: [],
    },
    standard: {
        name: 'Standard (Verified)',
        badge: 'Verified',
        durationDays: 60,
        monthlyPrice: 2999,
        annualPrice: 7499,
        visibility: '2x Boost (7 Days)',
        visibilityBoostDays: 7,
        visibilityBoostMultiplier: 2,
        maxProperties: 3,
        maxListingsAnnual: 3,
        features: [],
    },
    premium: {
        name: 'Premium (Gold)',
        badge: 'Gold',
        durationDays: 90,
        monthlyPrice: 6999,
        annualPrice: 14999,
        visibility: '5x Boost (15 Days)',
        visibilityBoostDays: 15,
        visibilityBoostMultiplier: 5,
        maxProperties: 10,
        maxListingsAnnual: 10,
        features: [],
    },
};

const docToPlan = (doc) => ({
    name: doc.name,
    badge: doc.badge,
    durationDays: doc.durationDays,
    monthlyPrice: doc.monthlyPrice ?? 0,
    annualPrice: doc.annualPrice ?? null,
    visibility: doc.visibility || 'Standard',
    visibilityBoostDays: doc.visibilityBoostDays ?? 0,
    visibilityBoostMultiplier: doc.visibilityBoostMultiplier ?? 1,
    maxProperties: doc.maxProperties ?? null,
    maxListingsAnnual: doc.maxPropertiesAnnual ?? null,
    features: doc.features || [],
});

/**
 * Load a single plan by key. Basic can be loaded even when inactive (auto-assign on signup).
 */
const getPlanByKey = async (planKey, { includeInactive = false } = {}) => {
    const query = { planKey };
    if (!includeInactive) query.isActive = true;

    const doc = await PackageSetting.findOne(query);
    if (doc) return docToPlan(doc);
    return FALLBACK_PLANS[planKey] || null;
};

/**
 * Map of planKey → plan data for subscription logic (active plans only).
 */
const getPlansMap = async () => {
    const docs = await PackageSetting.find({ isActive: true });
    const map = {};

    if (docs.length === 0) {
        return { ...FALLBACK_PLANS };
    }

    for (const doc of docs) {
        map[doc.planKey] = docToPlan(doc);
    }

    for (const key of ['basic', 'standard', 'premium']) {
        if (!map[key]) {
            map[key] = FALLBACK_PLANS[key];
        }
    }

    return map;
};

module.exports = {
    FALLBACK_PLANS,
    docToPlan,
    getPlanByKey,
    getPlansMap,
};
