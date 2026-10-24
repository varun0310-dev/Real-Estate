/**
 * Fixes legacy/corrupt feature rows (e.g. strings stored as { "0": "3", "1": "0", ... }).
 */
const normalizeFeature = (feature, includedDefault = true) => {
    if (!feature) {
        return { text: '', included: includedDefault };
    }
    if (typeof feature === 'string') {
        return { text: feature, included: includedDefault };
    }
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

const normalizeFeatures = (features) => {
    if (!Array.isArray(features)) return [];
    return features
        .map((f) => normalizeFeature(f))
        .filter((f) => f.text && f.text.trim().length > 0);
};

const featuresNeedRepair = (features) => {
    if (!Array.isArray(features) || features.length === 0) return true;
    return features.some((f) => typeof f !== 'object' || typeof f.text !== 'string');
};

const serializePackage = (doc) => {
    const plain = doc.toObject ? doc.toObject() : { ...doc };
    delete plain.__v;
    return {
        ...plain,
        features: normalizeFeatures(plain.features),
    };
};

module.exports = {
    normalizeFeature,
    normalizeFeatures,
    featuresNeedRepair,
    serializePackage,
};
