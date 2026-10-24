export const normalizeFeature = (feature, includedDefault = true) => {
    if (!feature) return { text: '', included: includedDefault };
    if (typeof feature === 'string') return { text: feature, included: includedDefault };
    if (typeof feature.text === 'string') {
        return { text: feature.text, included: feature.included !== false };
    }
    const keys = Object.keys(feature).filter((k) => k !== '_id' && /^\d+$/.test(k));
    if (keys.length > 0) {
        const text = keys
            .sort((a, b) => Number(a) - Number(b))
            .map((k) => feature[k])
            .join('');
        return { text, included: feature.included !== false };
    }
    return { text: '', included: includedDefault };
};

export const normalizeFeatures = (features) => {
    if (!Array.isArray(features)) return [];
    return features
        .map((f) => normalizeFeature(f))
        .filter((f) => f.text && f.text.trim().length > 0);
};

export const planEditSnapshot = (plan) => ({
    name: plan.name,
    badge: plan.badge ?? '',
    durationDays: plan.durationDays,
    monthlyPrice: plan.monthlyPrice ?? 0,
    annualPrice: plan.annualPrice ?? null,
    maxProperties: plan.maxProperties ?? null,
    maxPropertiesAnnual: plan.maxPropertiesAnnual ?? null,
    visibilityBoostDays: plan.visibilityBoostDays ?? 0,
    visibilityBoostMultiplier: plan.visibilityBoostMultiplier ?? 1,
    visibility: plan.visibility ?? '',
    isActive: plan.isActive !== false,
    features: normalizeFeatures(plan.features),
});
