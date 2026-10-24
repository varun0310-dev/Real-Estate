import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config';
import { FiCheck, FiX, FiClock, FiStar, FiZap, FiShield, FiAlertTriangle } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

const PLAN_VISUAL = {
    basic: {
        icon: <FiShield className="w-6 h-6" />,
        gradient: 'from-gray-500 to-gray-600',
    },
    standard: {
        icon: <FiZap className="w-6 h-6" />,
        gradient: 'from-[#4960B2] to-[#3b4f98]',
    },
    premium: {
        icon: <FiStar className="w-6 h-6" />,
        gradient: 'from-amber-500 to-orange-500',
    },
};

const MyPackage = () => {
    const navigate = useNavigate();
    const [subscription, setSubscription] = useState(null);
    const [planCatalog, setPlanCatalog] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');

        const packagesReq = axios.get(`${API_URL}/api/package-settings`);
        const subReq = token
            ? axios.get(`${API_URL}/api/subscriptions/my`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            : Promise.resolve(null);

        Promise.all([packagesReq, subReq])
            .then(([pkgRes, subRes]) => {
                const catalog = (pkgRes.data.packages || []).map((p) => ({
                    key: p.planKey,
                    name: p.name,
                    duration: `${p.durationDays} Days`,
                    monthlyPrice: p.monthlyPrice ?? 0,
                    ...(PLAN_VISUAL[p.planKey] || PLAN_VISUAL.basic),
                }));
                setPlanCatalog(catalog);
                if (subRes?.data?.subscription) {
                    setSubscription(subRes.data.subscription);
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const plan = planCatalog.find(p => p.key === subscription?.plan) || planCatalog[0] || {
        key: 'basic',
        name: 'Basic',
        duration: '—',
        monthlyPrice: 0,
        gradient: 'from-gray-500 to-gray-600',
        icon: <FiShield className="w-6 h-6" />,
    };
    const isExpired = subscription && (subscription.status !== 'active' || new Date(subscription.expiryDate) < new Date());
    const isActive = subscription && !isExpired;

    const daysLeft = subscription?.expiryDate
        ? Math.max(0, Math.ceil((new Date(subscription.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)))
        : 0;

    const expiryFormatted = subscription?.expiryDate
        ? new Date(subscription.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
        : null;

    const startFormatted = subscription?.startDate
        ? new Date(subscription.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
        : null;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-8 h-8 border-4 border-[#4960B2] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-black text-[#1e1e2d] flex items-center gap-2">
                    <HiSparkles className="text-amber-400" /> My Package
                </h1>
                <p className="text-gray-500 text-sm mt-1">Manage your seller subscription plan</p>
            </div>

            {!subscription ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
                    <FiAlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                    <h2 className="text-xl font-black text-[#1e1e2d] mb-2">No Subscription Found</h2>
                    <p className="text-gray-500 mb-6">You don't have an active subscription. Visit our pricing page to get started.</p>
                    <button
                        onClick={() => navigate('/pricing')}
                        className="bg-gradient-to-r from-[#4960B2] to-[#3b4f98] text-white font-black px-8 py-3 rounded-xl hover:opacity-90 transition"
                    >
                        View Plans
                    </button>
                </div>
            ) : (
                <>
                    {/* Status Banner */}
                    {isExpired && (
                        <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <FiAlertTriangle className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <p className="font-black text-red-700">Subscription Expired</p>
                                    <p className="text-sm text-red-500">Your plan expired on {expiryFormatted}. Property listing is disabled.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/pricing')}
                                className="md:ml-auto bg-red-500 hover:bg-red-600 text-white font-black px-6 py-2.5 rounded-xl text-sm transition"
                            >
                                Renew Now →
                            </button>
                        </div>
                    )}

                    {isActive && (
                        <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-2xl p-5 flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <FiCheck className="w-6 h-6 text-green-500" />
                            </div>
                            <div>
                                <p className="font-black text-green-700">Subscription Active</p>
                                <p className="text-sm text-green-600">{daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining — expires {expiryFormatted}</p>
                            </div>
                            {daysLeft <= 7 && (
                                <span className="md:ml-auto bg-orange-100 text-orange-700 border border-orange-200 text-xs font-black px-3 py-1 rounded-full">
                                    ⚠️ Expiring Soon
                                </span>
                            )}
                        </div>
                    )}

                    {/* Plan Card */}
                    <div className={`rounded-3xl bg-gradient-to-br ${plan.gradient} p-8 text-white mb-6 shadow-xl`}>
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                                    {plan.icon}
                                </div>
                                <h2 className="text-2xl font-black">{plan.name}</h2>
                                <p className="text-white/70 text-sm mt-1">{plan.duration} · ₹{plan.monthlyPrice.toLocaleString('en-IN')}/mo</p>
                            </div>
                            <span className={`text-xs font-black px-4 py-1.5 rounded-full ${isActive ? 'bg-green-400/20 text-green-200 border border-green-300/30' : 'bg-red-400/20 text-red-200 border border-red-300/30'}`}>
                                {isActive ? '● ACTIVE' : '● EXPIRED'}
                            </span>
                        </div>

                        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Start Date', value: startFormatted },
                                { label: 'Expiry Date', value: expiryFormatted },
                                { label: 'Billing', value: subscription.billingCycle === 'annual' ? 'Annual' : 'Monthly' },
                                { label: 'Amount Paid', value: `₹${subscription.amountPaid.toLocaleString('en-IN')}` },
                            ].map(({ label, value }) => (
                                <div key={label} className="bg-white/10 backdrop-blur rounded-xl p-3">
                                    <p className="text-white/60 text-[10px] uppercase font-black tracking-widest">{label}</p>
                                    <p className="text-white font-bold text-sm mt-1">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Progress bar */}
                    {subscription?.startDate && subscription?.expiryDate && (
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-bold text-[#1e1e2d]">Subscription Progress</span>
                                <span className="text-sm text-gray-500">{daysLeft} days left</span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                {(() => {
                                    const total = (new Date(subscription.expiryDate) - new Date(subscription.startDate)) / (1000 * 60 * 60 * 24);
                                    const elapsed = total - daysLeft;
                                    const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
                                    return (
                                        <div
                                            className={`h-full rounded-full bg-gradient-to-r ${plan.gradient} transition-all duration-500`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    );
                                })()}
                            </div>
                            <div className="flex justify-between text-xs text-gray-400 mt-2">
                                <span>{startFormatted}</span>
                                <span>{expiryFormatted}</span>
                            </div>
                        </div>
                    )}

                    {/* Upgrade CTA */}
                    <div className="bg-gradient-to-br from-[#f0f4ff] to-white border border-[#4960B2]/20 rounded-2xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-black text-[#1e1e2d]">
                                    {subscription.plan !== 'premium' ? 'Upgrade Your Plan' : '🏆 You\'re on the Best Plan!'}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {subscription.plan !== 'premium'
                                        ? 'Get more visibility, more listings and premium support.'
                                        : 'Enjoy 5x visibility boost and dedicated support.'}
                                </p>
                            </div>
                            {subscription.plan !== 'premium' && (
                                <button
                                    onClick={() => navigate('/pricing')}
                                    className="bg-gradient-to-r from-[#4960B2] to-[#3b4f98] text-white font-black px-6 py-2.5 rounded-xl text-sm hover:opacity-90 transition whitespace-nowrap ml-4"
                                >
                                    View Plans →
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default MyPackage;
