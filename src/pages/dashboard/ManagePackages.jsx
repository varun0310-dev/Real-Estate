import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';
import toast from 'react-hot-toast';
import {
    FiShield, FiZap, FiStar, FiSave, FiRefreshCw,
    FiPackage, FiDollarSign, FiClock, FiHome, FiTrendingUp,
    FiPlus, FiTrash2, FiCheck, FiX, FiToggleLeft, FiToggleRight
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { normalizeFeatures, planEditSnapshot } from '../../utils/packageFeatures';

const PLAN_META = {
    basic:    { icon: <FiShield className="w-6 h-6" />, color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', gradient: 'from-gray-500 to-gray-600' },
    standard: { icon: <FiZap    className="w-6 h-6" />, color: '#4960B2', bg: '#f0f4ff', border: '#4960B2', gradient: 'from-[#4960B2] to-[#3b4f98]' },
    premium:  { icon: <FiStar   className="w-6 h-6" />, color: '#d97706', bg: '#fffbeb', border: '#f59e0b', gradient: 'from-amber-500 to-orange-500' },
};

const ManagePackages = ({ embedded = false }) => {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState({});
    const [edited, setEdited] = useState({});
    const [loadError, setLoadError] = useState(null);

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        setLoading(true);
        setLoadError(null);
        try {
            if (!token) {
                setLoadError('You are not logged in. Please sign in again as super admin.');
                return;
            }
            const res = await axios.get(`${API_URL}/api/package-settings/all`, { headers });
            const pkgs = (res.data.packages || []).map((p) => ({
                ...p,
                features: normalizeFeatures(p.features),
            }));
            if (pkgs.length === 0) {
                setLoadError('No package plans found. Restart the backend server to seed default plans.');
            }
            setPackages(pkgs);
            const editState = {};
            pkgs.forEach((p) => {
                editState[p.planKey] = JSON.parse(JSON.stringify(p));
            });
            setEdited(editState);
        } catch (err) {
            const msg = err.response?.status === 403
                ? 'Access denied. Only super admin can manage packages.'
                : err.response?.data?.message || 'Failed to load package settings. Is the backend running on port 3001?';
            setLoadError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (planKey, field, value) => {
        setEdited(prev => ({
            ...prev,
            [planKey]: { ...prev[planKey], [field]: value }
        }));
    };

    const handleFeatureChange = (planKey, index, field, value) => {
        setEdited(prev => {
            const features = [...(prev[planKey].features || [])];
            features[index] = { ...features[index], [field]: value };
            return { ...prev, [planKey]: { ...prev[planKey], features } };
        });
    };

    const addFeature = (planKey) => {
        setEdited(prev => ({
            ...prev,
            [planKey]: {
                ...prev[planKey],
                features: [...(prev[planKey].features || []), { text: '', included: true }]
            }
        }));
    };

    const removeFeature = (planKey, index) => {
        setEdited(prev => {
            const features = [...(prev[planKey].features || [])];
            features.splice(index, 1);
            return { ...prev, [planKey]: { ...prev[planKey], features } };
        });
    };

    const handleSave = async (planKey) => {
        setSaving(prev => ({ ...prev, [planKey]: true }));
        try {
            const src = edited[planKey];
            const payload = {
                name: src.name,
                badge: src.badge,
                durationDays: src.durationDays,
                monthlyPrice: src.monthlyPrice,
                annualPrice: src.annualPrice,
                maxProperties: src.maxProperties,
                maxPropertiesAnnual: src.maxPropertiesAnnual,
                visibilityBoostDays: src.visibilityBoostDays,
                visibilityBoostMultiplier: src.visibilityBoostMultiplier,
                visibility: src.visibility,
                features: normalizeFeatures(src.features),
                isActive: src.isActive,
            };

            await axios.put(`${API_URL}/api/package-settings/${planKey}`, payload, { headers });
            toast.success(`${edited[planKey].name} plan updated successfully!`);
            window.dispatchEvent(new CustomEvent('packageSettingsUpdated'));
            await fetchPackages();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save changes');
        } finally {
            setSaving(prev => ({ ...prev, [planKey]: false }));
        }
    };

    const resetPlan = (planKey) => {
        const original = packages.find(p => p.planKey === planKey);
        if (original) {
            setEdited(prev => ({
                ...prev,
                [planKey]: JSON.parse(JSON.stringify(original))
            }));
            toast('Changes discarded', { icon: '↩️' });
        }
    };

    const isDirty = (planKey) => {
        const original = packages.find((p) => p.planKey === planKey);
        if (!original || !edited[planKey]) return false;
        return JSON.stringify(planEditSnapshot(edited[planKey])) !== JSON.stringify(planEditSnapshot(original));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-[#4960B2] border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500 text-sm font-medium">Loading package settings...</p>
                </div>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                <p className="text-red-700 font-semibold mb-2">{loadError}</p>
                <button
                    type="button"
                    onClick={fetchPackages}
                    className="px-4 py-2 rounded-xl bg-[#4960B2] text-white text-sm font-bold cursor-pointer"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className={embedded ? '' : 'p-6 bg-[#f5f6fa] min-h-screen'}>
            {/* Header */}
            {!embedded && (
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-[#4960B2]/10 rounded-xl">
                            <FiPackage className="w-6 h-6 text-[#4960B2]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-[#1e1e2d] tracking-tight">Package Settings</h1>
                            <p className="text-gray-500 text-sm mt-0.5">
                                Configure pricing plans shown to sellers. Changes reflect immediately on the Pricing page.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            <div className={`${embedded ? 'mb-6' : 'mb-8'} p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2`}>
                <HiSparkles className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-amber-700 text-xs font-medium">
                    Sellers see these plans on the Pricing page and at checkout. Subscription charges use the saved prices.
                    Existing subscriptions keep their original terms until renewed.
                </p>
            </div>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {packages.map((pkg) => {
                    const meta = PLAN_META[pkg.planKey] || PLAN_META.basic;
                    const editedPkg = edited[pkg.planKey];
                    if (!editedPkg) return null;
                    const dirty = isDirty(pkg.planKey);

                    return (
                        <div
                            key={pkg.planKey}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col"
                        >
                            {/* Card Header */}
                            <div className={`bg-gradient-to-r ${meta.gradient} p-5 text-white`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/20 rounded-xl">
                                            {meta.icon}
                                        </div>
                                        <div>
                                            <p className="text-white/70 text-xs font-medium uppercase tracking-widest">{pkg.planKey}</p>
                                            <h2 className="text-xl font-black">{editedPkg.name}</h2>
                                        </div>
                                    </div>
                                    {/* Active toggle */}
                                    <button
                                        onClick={() => handleChange(pkg.planKey, 'isActive', !editedPkg.isActive)}
                                        title={editedPkg.isActive ? 'Plan is active — click to deactivate' : 'Plan is inactive — click to activate'}
                                        className="cursor-pointer"
                                    >
                                        {editedPkg.isActive
                                            ? <FiToggleRight className="w-8 h-8 text-green-300" />
                                            : <FiToggleLeft className="w-8 h-8 text-white/50" />
                                        }
                                    </button>
                                </div>
                                {dirty && (
                                    <div className="mt-3 bg-white/20 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-yellow-300 rounded-full animate-pulse" />
                                        Unsaved changes
                                    </div>
                                )}
                            </div>

                            {/* Card Body */}
                            <div className="p-5 flex-1 flex flex-col gap-5">

                                {/* Basic Info */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Display Name</label>
                                    <input
                                        type="text"
                                        value={editedPkg.name}
                                        onChange={e => handleChange(pkg.planKey, 'name', e.target.value)}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#4960B2]/30 focus:border-[#4960B2]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Badge Label</label>
                                    <input
                                        type="text"
                                        value={editedPkg.badge || ''}
                                        onChange={e => handleChange(pkg.planKey, 'badge', e.target.value)}
                                        placeholder="e.g. Free, Verified, Gold"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4960B2]/30 focus:border-[#4960B2]"
                                    />
                                </div>

                                {/* Pricing */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <FiDollarSign className="text-[#4960B2]" />Pricing (₹ INR)
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-gray-400 font-medium mb-1 block">Monthly Price (₹)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={editedPkg.monthlyPrice}
                                                onChange={e => handleChange(pkg.planKey, 'monthlyPrice', Number(e.target.value))}
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4960B2]/30 focus:border-[#4960B2]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 font-medium mb-1 block">Annual Price (₹)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={editedPkg.annualPrice ?? ''}
                                                onChange={e => handleChange(pkg.planKey, 'annualPrice', e.target.value === '' ? null : Number(e.target.value))}
                                                placeholder="N/A"
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4960B2]/30 focus:border-[#4960B2]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Duration & Property Limits */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <FiClock className="text-[#4960B2]" />Duration & Limits
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="text-xs text-gray-400 font-medium mb-1 block">Duration (Days)</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={editedPkg.durationDays}
                                                onChange={e => handleChange(pkg.planKey, 'durationDays', Number(e.target.value))}
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4960B2]/30 focus:border-[#4960B2]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 font-medium mb-1 block">Max Properties</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={editedPkg.maxProperties ?? ''}
                                                onChange={e => handleChange(pkg.planKey, 'maxProperties', e.target.value === '' ? null : Number(e.target.value))}
                                                placeholder="∞"
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4960B2]/30 focus:border-[#4960B2]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 font-medium mb-1 block">Annual Max</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={editedPkg.maxPropertiesAnnual ?? ''}
                                                onChange={e => handleChange(pkg.planKey, 'maxPropertiesAnnual', e.target.value === '' ? null : Number(e.target.value))}
                                                placeholder="∞"
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4960B2]/30 focus:border-[#4960B2]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Visibility */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <FiTrendingUp className="text-[#4960B2]" />Visibility Settings
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="col-span-3">
                                            <label className="text-xs text-gray-400 font-medium mb-1 block">Visibility Label</label>
                                            <input
                                                type="text"
                                                value={editedPkg.visibility || ''}
                                                onChange={e => handleChange(pkg.planKey, 'visibility', e.target.value)}
                                                placeholder="e.g. 2x Boost (7 Days)"
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4960B2]/30 focus:border-[#4960B2]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 font-medium mb-1 block">Boost Multiplier</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={editedPkg.visibilityBoostMultiplier || 1}
                                                onChange={e => handleChange(pkg.planKey, 'visibilityBoostMultiplier', Number(e.target.value))}
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4960B2]/30 focus:border-[#4960B2]"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-xs text-gray-400 font-medium mb-1 block">Boost Days</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={editedPkg.visibilityBoostDays || 0}
                                                onChange={e => handleChange(pkg.planKey, 'visibilityBoostDays', Number(e.target.value))}
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4960B2]/30 focus:border-[#4960B2]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Features */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Features List</label>
                                        <button
                                            onClick={() => addFeature(pkg.planKey)}
                                            className="flex items-center gap-1 text-xs font-semibold text-[#4960B2] hover:text-[#3b4f98] cursor-pointer"
                                        >
                                            <FiPlus className="w-3.5 h-3.5" /> Add Feature
                                        </button>
                                    </div>
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                        {(editedPkg.features || []).map((feat, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleFeatureChange(pkg.planKey, idx, 'included', !feat.included)}
                                                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-colors ${feat.included ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-red-100 text-red-400 hover:bg-red-200'}`}
                                                    title={feat.included ? 'Included — click to exclude' : 'Excluded — click to include'}
                                                >
                                                    {feat.included ? <FiCheck className="w-3.5 h-3.5" /> : <FiX className="w-3.5 h-3.5" />}
                                                </button>
                                                <input
                                                    type="text"
                                                    value={feat.text}
                                                    onChange={e => handleFeatureChange(pkg.planKey, idx, 'text', e.target.value)}
                                                    placeholder="Feature description"
                                                    className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#4960B2]/30 focus:border-[#4960B2]"
                                                />
                                                <button
                                                    onClick={() => removeFeature(pkg.planKey, idx)}
                                                    className="flex-shrink-0 p-1.5 text-gray-300 hover:text-red-500 cursor-pointer transition-colors"
                                                    title="Remove feature"
                                                >
                                                    <FiTrash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                        {(editedPkg.features || []).length === 0 && (
                                            <p className="text-xs text-gray-400 italic">No features listed. Click "Add Feature" to start.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer */}
                            <div className="px-5 pb-5 flex gap-2">
                                <button
                                    onClick={() => resetPlan(pkg.planKey)}
                                    disabled={!dirty || saving[pkg.planKey]}
                                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                                >
                                    <FiRefreshCw className="w-4 h-4" /> Reset
                                </button>
                                <button
                                    onClick={() => handleSave(pkg.planKey)}
                                    disabled={!dirty || saving[pkg.planKey]}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r ${meta.gradient} hover:shadow-lg hover:shadow-blue-100`}
                                >
                                    {saving[pkg.planKey]
                                        ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                                        : <><FiSave className="w-4 h-4" /> Save Changes</>
                                    }
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Live Preview Note */}
            <div className="mt-8 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-700 mb-1 flex items-center gap-2">
                    <FiHome className="text-[#4960B2]" /> How changes appear to sellers
                </h3>
                <p className="text-sm text-gray-500">
                    Package changes are fetched dynamically by the Pricing page — sellers will see updated plans
                    immediately after you save. Existing subscriptions are <strong>not affected</strong> by price changes;
                    only new subscriptions use the new settings.
                </p>
            </div>
        </div>
    );
};

export default ManagePackages;
