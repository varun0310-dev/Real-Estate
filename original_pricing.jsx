import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config';
import { FiCheck, FiX, FiZap, FiShield, FiStar, FiClock, FiTrendingUp } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

const PLANS = [
    {
        key: 'basic',
        name: 'Basic',
        badge: 'Free',
        icon: <FiShield className="w-7 h-7" />,
        color: '#6b7280',
        gradient: 'from-gray-500 to-gray-600',
        bgLight: '#f9fafb',
        borderColor: '#e5e7eb',
        duration: '30 Days',
        visibility: 'Standard',
        monthlyPrice: 0,
        annualPrice: null,
        annualLabel: 'N/A (Single Listing)',
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
        key: 'standard',
        name: 'Standard',
        badge: 'Verified',
        icon: <FiZap className="w-7 h-7" />,
        color: '#4960B2',
        gradient: 'from-[#4960B2] to-[#3b4f98]',
        bgLight: '#f0f4ff',
        borderColor: '#4960B2',
        recommended: true,
        duration: '60 Days',
        visibility: '2x Boost (7 Days)',
        monthlyPrice: 2999,
        annualPrice: 7499,
        annualLabel: 'â‚¹7,499 (3 listings/yr)',
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
        key: 'premium',
        name: 'Premium',
        badge: 'Gold',
        icon: <FiStar className="w-7 h-7" />,
        color: '#d97706',
        gradient: 'from-amber-500 to-orange-500',
        bgLight: '#fffbeb',
        borderColor: '#d97706',
        duration: '90 Days',
        visibility: '5x Boost (15 Days)',
        monthlyPrice: 6999,
        annualPrice: 15999,
        annualLabel: 'â‚¹15,999 (5 listings/yr)',
        features: [
            { text: '90-Day Active Listing', included: true },
            { text: '5x Visibility Boost', included: true },
            { text: '5 Listings/Year (Annual)', included: true },
            { text: 'Premium Analytics', included: true },
            { text: '15-Day Boost Window', included: true },
            { text: 'Dedicated Support', included: true },
            { text: 'Gold Verified Badge', included: true },
        ],
    },
];

const PricingPage = () => {
    const navigate = useNavigate();
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [currentSub, setCurrentSub] = useState(null);
    const [loading, setLoading] = useState(false);
    const [subscribingPlan, setSubscribingPlan] = useState(null);
    const [message, setMessage] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsAuthenticated(!!token);
        if (token) {
            axios.get(`${API_URL}/api/profile/me`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => {
                setProfile(res.data.user);
            }).catch(() => {});

            axios.get(`${API_URL}/api/subscriptions/my`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => {
                setCurrentSub(res.data.subscription);
            }).catch(() => {});
        }
    }, []);

    const isSeller = profile?.userType === 'seller';

    const handleSubscribe = async (planKey) => {
        if (!isAuthenticated) {
            navigate('/');
            return;
        }
        if (!isSeller) {
            setMessage({ type: 'error', text: 'Only seller accounts can subscribe to packages. Please update your profile to Seller first.' });
            return;
        }
        if (planKey === 'basic') {
            setMessage({ type: 'info', text: 'Basic plan is automatically assigned to all sellers. Please upgrade to Standard or Premium.' });
            return;
        }
        setSubscribingPlan(planKey);
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/api/subscriptions/subscribe`,
                { plan: planKey, billingCycle },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCurrentSub(res.data.subscription);
            setMessage({ type: 'success', text: `ðŸŽ‰ Successfully subscribed to ${PLANS.find(p => p.key === planKey).name} plan!` });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to subscribe. Please try again.' });
        } finally {
            setLoading(false);
            setSubscribingPlan(null);
        }
    };

    const isCurrentPlan = (planKey) => currentSub?.plan === planKey && currentSub?.status === 'active';

    const getPrice = (plan) => {
        if (plan.monthlyPrice === 0) return 'â‚¹0';
        if (billingCycle === 'annual' && plan.annualPrice) {
            return `â‚¹${plan.annualPrice.toLocaleString('en-IN')}`;
        }
        return `â‚¹${plan.monthlyPrice.toLocaleString('en-IN')}`;
    };

    const getPeriodLabel = (plan) => {
        if (plan.monthlyPrice === 0) return '/month';
        if (billingCycle === 'annual' && plan.annualPrice) return '/year';
        return '/month';
    };

    const expiryFormatted = currentSub?.expiryDate
        ? new Date(currentSub.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
        : null;

    const isExpired = currentSub && (currentSub.status !== 'active' || new Date(currentSub.expiryDate) < new Date());

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f0f4ff] via-white to-[#fef9ee]">
            {/* Hero Banner */}
            <div className="bg-gradient-to-r from-[#1e2d5c] via-[#4960B2] to-[#3b4f98] py-16 px-4">
                <div className="max-w-5xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white text-sm font-semibold px-4 py-2 rounded-full mb-6 border border-white/20">
                        <HiSparkles className="text-yellow-300" />
                        Seller Subscription Plans
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
                        Choose the Right Plan<br />
                        <span className="text-yellow-300">for Your Business</span>
                    </h1>
                    <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
                        Boost your property listings with verified badges, enhanced visibility, and premium support.
                    </p>

                    {/* Billing Toggle */}
                    <div className="inline-flex items-center bg-white/10 backdrop-blur border border-white/20 rounded-xl p-1">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${billingCycle === 'monthly' ? 'bg-white text-[#4960B2]' : 'text-white/80 hover:text-white'}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle('annual')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${billingCycle === 'annual' ? 'bg-white text-[#4960B2]' : 'text-white/80 hover:text-white'}`}
                        >
                            Annual
                            <span className="bg-green-400 text-white text-[10px] font-black px-2 py-0.5 rounded-full">SAVE</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Alert Messages */}
            {message && (
                <div className="max-w-5xl mx-auto mt-6 px-4">
                    <div className={`px-5 py-4 rounded-xl text-sm font-medium flex items-start gap-3 ${
                        message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                        message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                        <span className="text-lg">{message.type === 'success' ? 'âœ…' : message.type === 'error' ? 'âŒ' : 'â„¹ï¸'}</span>
                        <span>{message.text}</span>
                        <button onClick={() => setMessage(null)} className="ml-auto font-black text-lg leading-none opacity-60 hover:opacity-100">Ã—</button>
                    </div>
                </div>
            )}

            {/* Current Subscription Banner */}
            {currentSub && (
                <div className="max-w-5xl mx-auto mt-6 px-4">
                    <div className={`rounded-2xl px-6 py-4 flex flex-wrap items-center gap-4 border ${isExpired ? 'bg-red-50 border-red-200' : 'bg-[#f0f4ff] border-[#4960B2]/20'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isExpired ? 'bg-red-100' : 'bg-[#4960B2]/10'}`}>
                                <FiClock className={isExpired ? 'text-red-500' : 'text-[#4960B2]'} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-[#1e1e2d]">
                                    Current Plan: <span className={isExpired ? 'text-red-600' : 'text-[#4960B2]'}>
                                        {PLANS.find(p => p.key === currentSub.plan)?.name} ({PLANS.find(p => p.key === currentSub.plan)?.badge})
                                    </span>
                                </p>
                                <p className="text-xs text-gray-500">
                                    {isExpired ? `âš ï¸ Expired on ${expiryFormatted}` : `âœ… Active until ${expiryFormatted}`}
                                </p>
                            </div>
                        </div>
                        {isExpired && (
                            <span className="ml-auto bg-red-100 text-red-600 text-xs font-black px-3 py-1 rounded-full border border-red-200">
                                EXPIRED â€” Renew to unlock properties
                            </span>
                        )}
                        {!isExpired && (
                            <span className="ml-auto bg-green-100 text-green-600 text-xs font-black px-3 py-1 rounded-full border border-green-200">
                                ACTIVE
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Pricing Cards */}
            <div className="max-w-5xl mx-auto py-12 px-4">
                <div className="grid md:grid-cols-3 gap-6">
                    {PLANS.map((plan) => {
                        const active = isCurrentPlan(plan.key);
                        return (
                            <div
                                key={plan.key}
                                className={`relative rounded-3xl border-2 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col ${
                                    plan.recommended
                                        ? `border-[#4960B2] shadow-xl shadow-[#4960B2]/10`
                                        : plan.key === 'premium'
                                        ? 'border-amber-300 shadow-lg shadow-amber-100'
                                        : 'border-gray-200 shadow-sm'
                                }`}
                                style={{ background: plan.bgLight }}
                            >
                                {plan.recommended && (
                                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-[#4960B2] to-[#3b4f98] text-white text-center text-[11px] font-black uppercase tracking-widest py-1.5">
                                        â­ Most Popular
                                    </div>
                                )}

                                <div className={`p-7 ${plan.recommended ? 'mt-8' : ''}`}>
                                    {/* Plan header */}
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center text-white mb-4 shadow-lg`}>
                                        {plan.icon}
                                    </div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="text-xl font-black text-[#1e1e2d]">{plan.name}</h2>
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border`}
                                            style={{ color: plan.color, borderColor: plan.color, background: `${plan.color}15` }}>
                                            {plan.badge}
                                        </span>
                                    </div>

                                    {/* Duration */}
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-5">
                                        <FiClock className="text-gray-400" />
                                        {plan.duration} Â· {plan.visibility}
                                    </div>

                                    {/* Price */}
                                    <div className="mb-2">
                                        <span className="text-4xl font-black" style={{ color: plan.color }}>
                                            {getPrice(plan)}
                                        </span>
                                        <span className="text-gray-400 text-sm ml-1">{getPeriodLabel(plan)}</span>
                                    </div>
                                    {billingCycle === 'annual' && plan.annualPrice && (
                                        <p className="text-xs text-gray-400 mb-4">{plan.annualLabel}</p>
                                    )}
                                    {billingCycle === 'monthly' && plan.annualPrice && (
                                        <p className="text-xs text-gray-400 mb-4">Annual: {plan.annualLabel}</p>
                                    )}
                                    {!plan.annualPrice && (
                                        <p className="text-xs text-gray-400 mb-4">N/A (Single Listing)</p>
                                    )}

                                    {/* CTA Button */}
                                    {active ? (
                                        <button
                                            disabled
                                            className="w-full py-3 rounded-xl text-sm font-black border-2 border-green-400 text-green-600 bg-green-50 cursor-default"
                                        >
                                            âœ… Current Plan
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleSubscribe(plan.key)}
                                            disabled={loading && subscribingPlan === plan.key}
                                            className={`w-full py-3 rounded-xl text-sm font-black text-white transition-all duration-200 bg-gradient-to-br ${plan.gradient} hover:opacity-90 hover:shadow-lg active:scale-95 disabled:opacity-60`}
                                        >
                                            {loading && subscribingPlan === plan.key ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                                    </svg>
                                                    Processing...
                                                </span>
                                            ) : plan.key === 'basic' ? 'Current Free Plan' : `Get ${plan.name}`}
                                        </button>
                                    )}
                                </div>

                                {/* Feature list */}
                                <div className="px-7 pb-7 flex-1">
                                    <div className="border-t border-gray-200 pt-5 space-y-3">
                                        {plan.features.map((f, i) => (
                                            <div key={i} className="flex items-center gap-3 text-sm">
                                                {f.included ? (
                                                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                                                        style={{ background: `${plan.color}20` }}>
                                                        <FiCheck className="w-3 h-3" style={{ color: plan.color }} />
                                                    </div>
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                        <FiX className="w-3 h-3 text-gray-400" />
                                                    </div>
                                                )}
                                                <span className={f.included ? 'text-gray-700' : 'text-gray-400'}>{f.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Comparison Table */}
                <div className="mt-16">
                    <h2 className="text-2xl font-black text-[#1e1e2d] text-center mb-8">Detailed Comparison</h2>
                    <div className="rounded-3xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-[#1e2d5c] to-[#4960B2]">
                                    <th className="text-left p-5 text-white font-black text-sm">Feature</th>
                                    <th className="text-center p-5 text-white font-black text-sm">Basic (Free)</th>
                                    <th className="text-center p-5 text-white font-black text-sm">Standard (Verified)</th>
                                    <th className="text-center p-5 text-amber-300 font-black text-sm">Premium (Gold)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ['Duration', '30 Days', '60 Days', '90 Days'],
                                    ['Visibility', 'Standard', '2x Boost (7 Days)', '5x Boost (15 Days)'],
                                    ['Monthly Price', 'â‚¹0', 'â‚¹2,999', 'â‚¹6,999'],
                                    ['Annual Price', 'N/A (Single Listing)', 'â‚¹7,499 (3 listings/yr)', 'â‚¹15,999 (5 listings/yr)'],
                                    ['Verified Badge', 'â€”', 'âœ…', 'âœ…'],
                                    ['Priority Support', 'â€”', 'âœ…', 'âœ… Dedicated'],
                                    ['Analytics', 'Basic', 'Advanced', 'Premium'],
                                ].map(([label, basic, standard, premium], idx) => (
                                    <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                        <td className="p-4 text-sm font-bold text-[#1e1e2d]">{label}</td>
                                        <td className="p-4 text-sm text-center text-gray-600">{basic}</td>
                                        <td className="p-4 text-sm text-center text-[#4960B2] font-semibold">{standard}</td>
                                        <td className="p-4 text-sm text-center text-amber-600 font-semibold">{premium}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* FAQ */}
                <div className="mt-16 text-center">
                    <div className="bg-gradient-to-br from-[#4960B2] to-[#1e2d5c] rounded-3xl p-10 text-white">
                        <FiTrendingUp className="w-10 h-10 mx-auto mb-4 text-yellow-300" />
                        <h3 className="text-2xl font-black mb-3">Ready to grow your real estate business?</h3>
                        <p className="text-white/70 mb-6 max-w-lg mx-auto">
                            Start with our free Basic plan and upgrade when you're ready to scale your listings.
                        </p>
                        <button
                            onClick={() => navigate('/dashboard/my-properties')}
                            className="bg-white text-[#4960B2] font-black px-8 py-3 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            Go to My Properties â†’
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingPage;

