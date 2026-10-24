import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { FiArrowLeft, FiCheck } from 'react-icons/fi';
import { API_URL } from '../config';
import CheckoutPaymentModal from '../components/checkout/CheckoutPaymentModal';

const ALLOWED_PLANS = ['standard', 'premium'];

const CheckoutConsent = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const planKey = location.state?.planKey || searchParams.get('plan');
    const billingCycle = location.state?.billingCycle || searchParams.get('cycle') || 'monthly';

    const [planMeta, setPlanMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }
        if (!planKey || !ALLOWED_PLANS.includes(planKey)) {
            navigate('/pricing');
            return;
        }

        axios.get(`${API_URL}/api/profile/me`, {
            headers: { Authorization: `Bearer ${token}` },
        }).then((res) => {
            if (res.data.user?.userType !== 'seller') {
                navigate('/pricing');
            }
        }).catch(() => navigate('/'));

        axios.get(`${API_URL}/api/package-settings`)
            .then((res) => {
                const pkg = (res.data.packages || []).find((p) => p.planKey === planKey);
                if (!pkg) {
                    navigate('/pricing');
                    return;
                }
                setPlanMeta(pkg);
            })
            .catch(() => navigate('/pricing'))
            .finally(() => setLoading(false));
    }, [planKey, navigate]);

    const baseAmount = useMemo(() => {
        if (!planMeta) return 0;
        if (billingCycle === 'annual') return planMeta.annualPrice || 0;
        return planMeta.monthlyPrice || 0;
    }, [planMeta, billingCycle]);

    const cycleLabel = billingCycle === 'annual' ? 'Annual' : 'Monthly';

    const handleSubscribeSuccess = () => {
        setPaymentOpen(false);
        setSuccessMessage(`You're subscribed to ${planMeta?.name || planKey}!`);
        setTimeout(() => navigate('/pricing'), 2200);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0f4ff] via-white to-[#fef9ee]">
                <div className="w-10 h-10 border-4 border-[#4960B2] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f0f4ff] via-white to-[#fef9ee] py-12 px-4">
            <div className="max-w-xl mx-auto">
                <button
                    type="button"
                    onClick={() => navigate('/pricing')}
                    className="inline-flex items-center gap-2 text-sm font-bold text-[#4960B2] mb-6 hover:underline"
                >
                    <FiArrowLeft /> Back to pricing
                </button>

                <div className="bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden">
                    <div className="px-8 py-6 bg-gradient-to-r from-[#1e2d5c] to-[#4960B2] text-white">
                        <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-1">Checkout</p>
                        <h1 className="text-2xl font-black">Review & confirm</h1>
                    </div>

                    <div className="p-8 space-y-6">
                        {successMessage ? (
                            <div className="text-center py-8">
                                <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
                                <p className="font-bold text-lg text-[#1e1e2d]">{successMessage}</p>
                                <p className="text-sm text-gray-500 mt-2">Redirecting to pricing…</p>
                            </div>
                        ) : (
                            <>
                                <div className="rounded-2xl border border-[#4960B2]/20 bg-[#f0f4ff]/60 p-5 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Plan</span>
                                        <span className="font-black text-[#4960B2]">{planMeta?.name}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Billing cycle</span>
                                        <span className="font-semibold">{cycleLabel}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Price</span>
                                        <span className="font-black text-lg">₹{baseAmount.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>

                                <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
                                    <p className="font-bold text-[#1e1e2d]">Subscription terms</p>
                                    <ul className="space-y-2">
                                        <li className="flex gap-2"><FiCheck className="text-[#4960B2] shrink-0 mt-0.5" /> Your plan starts immediately after payment confirmation.</li>
                                        <li className="flex gap-2"><FiCheck className="text-[#4960B2] shrink-0 mt-0.5" /> Listings and visibility perks follow the selected package limits.</li>
                                        <li className="flex gap-2"><FiCheck className="text-[#4960B2] shrink-0 mt-0.5" /> You can upgrade again anytime from the pricing page.</li>
                                    </ul>
                                </div>

                                <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-gray-200 p-4 hover:border-[#4960B2]/40 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={termsAccepted}
                                        onChange={(e) => setTermsAccepted(e.target.checked)}
                                        className="mt-1 w-4 h-4 accent-[#4960B2]"
                                    />
                                    <span className="text-sm text-gray-700">
                                        I agree to the subscription terms and authorize payment for this plan via Razorpay.
                                    </span>
                                </label>

                                {baseAmount <= 0 && (
                                    <p className="text-sm text-red-600 font-medium">
                                        This billing option is not available for the selected plan. Choose monthly billing or another plan on the pricing page.
                                    </p>
                                )}

                                <button
                                    type="button"
                                    disabled={!termsAccepted || baseAmount <= 0}
                                    onClick={() => setPaymentOpen(true)}
                                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#4960B2] to-[#3b4f98] text-white font-black disabled:opacity-50 hover:opacity-95 transition-opacity"
                                >
                                    Proceed to checkout
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <CheckoutPaymentModal
                open={paymentOpen}
                onClose={() => setPaymentOpen(false)}
                planKey={planKey}
                planName={planMeta?.name}
                billingCycle={billingCycle}
                baseAmount={baseAmount}
                onSuccess={handleSubscribeSuccess}
            />
        </div>
    );
};

export default CheckoutConsent;
