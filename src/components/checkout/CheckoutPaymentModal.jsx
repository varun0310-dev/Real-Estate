import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FiX, FiLock, FiShield, FiCheck, FiCopy } from 'react-icons/fi';
import { API_URL } from '../../config';

const formatInr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/** Surface API message, rate-limit text, or network errors in the UI */
const getApiErrorMessage = (err, fallback) => {
    const data = err.response?.data;
    if (typeof data === 'string' && data.trim()) return data;
    if (data?.message) return data.message;
    if (data?.error?.description) return data.error.description;
    if (err.response?.status === 503) return data?.message || 'Razorpay is not configured on the server.';
    if (!err.response) return 'Cannot reach the server. Is the backend running on port 3001?';
    return fallback;
};

const loadRazorpayScript = () => new Promise((resolve) => {
    if (window.Razorpay) {
        resolve(true);
        return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
});

const CheckoutPaymentModal = ({
    open,
    onClose,
    plan,
    planKey,
    planName,
    billingCycle,
    baseAmount,
    onSuccess,
}) => {
    const [billingName, setBillingName] = useState('');
    const [billingEmail, setBillingEmail] = useState('');
    const [billingPhone, setBillingPhone] = useState('');
    const [couponInput, setCouponInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [payLoading, setPayLoading] = useState(false);
    const [payError, setPayError] = useState('');
    const [cardCopied, setCardCopied] = useState(false);

    const discountAmount = appliedCoupon?.discountAmount ?? 0;
    const finalAmount = appliedCoupon?.finalAmount ?? baseAmount;

    const cycleLabel = billingCycle === 'annual' ? 'Annual billing' : 'Monthly billing';

    const authHeaders = useCallback(() => {
        const token = localStorage.getItem('token');
        return { Authorization: `Bearer ${token}` };
    }, []);

    useEffect(() => {
        if (!open) return;
        const token = localStorage.getItem('token');
        if (!token) return;
        axios.get(`${API_URL}/api/profile/me`, { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => {
                const u = res.data.user;
                if (u?.name) setBillingName(u.name);
                if (u?.email) setBillingEmail(u.email);
                if (u?.phone) setBillingPhone(u.phone);
            })
            .catch(() => {});
    }, [open]);

    if (!open) return null;

    const resetCoupon = () => {
        setAppliedCoupon(null);
        setCouponError('');
    };

    const handleApplyCoupon = async () => {
        setCouponError('');
        setCouponLoading(true);
        try {
            const res = await axios.post(
                `${API_URL}/api/coupons/validate`,
                {
                    code: couponInput.trim(),
                    planKey,
                    billingCycle,
                    amount: baseAmount,
                },
                { headers: authHeaders() }
            );
            setAppliedCoupon(res.data);
        } catch (err) {
            setAppliedCoupon(null);
            setCouponError(getApiErrorMessage(err, 'Could not apply coupon.'));
        } finally {
            setCouponLoading(false);
        }
    };

    const subscribeDirect = async () => {
        const body = {
            plan: planKey,
            billingCycle,
            amountPaid: finalAmount,
        };
        if (appliedCoupon?.code) {
            body.couponCode = appliedCoupon.code;
        }
        const res = await axios.post(
            `${API_URL}/api/subscriptions/subscribe`,
            body,
            { headers: authHeaders() }
        );
        onSuccess?.(res.data);
    };

    const handleSubscribe = async () => {
        setPayError('');
        setPayLoading(true);
        try {
            if (finalAmount <= 0) {
                await subscribeDirect();
                setPayLoading(false);
                return;
            }

            const orderRes = await axios.post(
                `${API_URL}/api/payments/razorpay/create-order`,
                {
                    plan: planKey,
                    billingCycle,
                    amount: finalAmount,
                    couponCode: appliedCoupon?.code || undefined,
                },
                { headers: authHeaders() }
            );

            if (orderRes.data.skipPayment) {
                await subscribeDirect();
                setPayLoading(false);
                return;
            }

            const loaded = await loadRazorpayScript();
            if (!loaded || !window.Razorpay) {
                setPayError('Could not load Razorpay checkout. Check your connection and try again.');
                setPayLoading(false);
                return;
            }

            const { orderId, amount, currency, keyId } = orderRes.data;

            const rzp = new window.Razorpay({
                key: keyId,
                amount,
                currency,
                name: 'Real Estate Platform',
                description: `${planName} — ${cycleLabel}`,
                order_id: orderId,
                prefill: {
                    name: billingName,
                    email: billingEmail,
                    contact: billingPhone,
                },
                theme: { color: '#4960B2' },
                handler: async (response) => {
                    try {
                        const verifyRes = await axios.post(
                            `${API_URL}/api/payments/razorpay/verify`,
                            {
                                plan: planKey,
                                billingCycle,
                                amount: finalAmount,
                                couponCode: appliedCoupon?.code || undefined,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            },
                            { headers: authHeaders() }
                        );
                        onSuccess?.(verifyRes.data);
                    } catch (err) {
                        setPayError(getApiErrorMessage(err, 'Payment verified but subscription failed.'));
                    } finally {
                        setPayLoading(false);
                    }
                },
                modal: {
                    ondismiss: () => {
                        setPayLoading(false);
                    },
                },
            });

            rzp.on('payment.failed', (resp) => {
                setPayError(resp.error?.description || 'Payment failed. Please try again.');
                setPayLoading(false);
            });

            rzp.open();
        } catch (err) {
            setPayError(getApiErrorMessage(err, 'Could not start checkout. Please try again.'));
            setPayLoading(false);
        }
    };

    const handleCopyTestCard = () => {
        navigator.clipboard.writeText('4100280000001007');
        setCardCopied(true);
        setTimeout(() => setCardCopied(false), 2500);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-gray-100">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#f0f4ff] to-white">
                    <div>
                        <h2 className="text-lg font-black text-[#1e1e2d]">Checkout</h2>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                            <FiShield size={12} className="text-[#4960B2]" />
                            Secure payment via Razorpay (test mode)
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500">
                        <FiX size={20} />
                    </button>
                </div>

                <div className="grid md:grid-cols-2 max-h-[85vh] md:max-h-[580px] overflow-hidden">
                    <div className="p-6 overflow-y-auto space-y-4 border-b md:border-b-0 md:border-r border-gray-100">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Billing details</p>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-semibold text-gray-600">Full name</label>
                                    <input
                                        type="text"
                                        value={billingName}
                                        onChange={(e) => setBillingName(e.target.value)}
                                        placeholder="Your name"
                                        className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#4960B2] text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-600">Email</label>
                                    <input
                                        type="email"
                                        value={billingEmail}
                                        onChange={(e) => setBillingEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#4960B2] text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-bold text-[#4960B2]">Coupon code</p>
                            <div className="mt-2 flex gap-2">
                                <input
                                    type="text"
                                    value={couponInput}
                                    onChange={(e) => {
                                        setCouponInput(e.target.value);
                                        if (appliedCoupon) resetCoupon();
                                    }}
                                    placeholder="Enter code"
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#4960B2] focus:ring-2 focus:ring-[#4960B2]/20 text-sm font-mono uppercase"
                                />
                                <button
                                    type="button"
                                    disabled={!couponInput.trim() || couponLoading}
                                    onClick={handleApplyCoupon}
                                    className="px-4 py-2.5 rounded-xl bg-[#4960B2] text-white text-sm font-bold disabled:opacity-50 hover:bg-[#3a4d91]"
                                >
                                    {couponLoading ? '…' : 'Apply'}
                                </button>
                            </div>
                            {couponError && <p className="text-xs text-red-600 mt-2 font-medium">{couponError}</p>}
                            {appliedCoupon?.valid && (
                                <p className="text-xs text-emerald-600 mt-2 font-medium">{appliedCoupon.message}</p>
                            )}
                        </div>

                        {/* Razorpay Test Mode Helper Card */}
                        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-gray-700 space-y-2">
                            <div className="flex items-center justify-between font-bold text-[#4960B2]">
                                <span className="flex items-center gap-1.5">
                                    <FiShield size={13} /> Razorpay Test Mode Credentials
                                </span>
                                <span className="bg-blue-100 text-[#4960B2] text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                                    Domestic
                                </span>
                            </div>

                            <p className="text-[11px] text-gray-600 leading-relaxed">
                                Indian Razorpay accounts reject international cards (like <code className="bg-red-50 text-red-600 px-1 py-0.5 rounded font-mono">4111...</code>). Use Razorpay's <strong>Domestic Indian test card</strong>:
                            </p>

                            <div className="flex items-center justify-between bg-white rounded-lg px-2.5 py-1.5 border border-blue-100 font-mono text-xs">
                                <span className="font-bold text-gray-800">4100 2800 0000 1007</span>
                                <button
                                    type="button"
                                    onClick={handleCopyTestCard}
                                    className="text-[11px] text-[#4960B2] hover:underline font-bold cursor-pointer inline-flex items-center gap-1"
                                >
                                    {cardCopied ? (
                                        <>
                                            <FiCheck size={12} className="text-emerald-600" />
                                            <span className="text-emerald-600">Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <FiCopy size={12} />
                                            <span>Copy</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-600 bg-white/70 p-1.5 rounded-lg border border-blue-100">
                                <div><strong>Expiry:</strong> 12/28</div>
                                <div><strong>CVV:</strong> 123</div>
                                <div><strong>OTP:</strong> 1234</div>
                            </div>

                            <p className="text-[10px] text-gray-500">
                                💡 <em>Or test with <strong>UPI</strong> (enter <code className="bg-gray-100 px-1 rounded font-mono">test@upi</code>) or <strong>Netbanking</strong> and click Success!</em>
                            </p>
                        </div>
                    </div>

                    <div className="p-6 md:overflow-y-auto bg-[#fafbff] flex flex-col">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Order summary</p>

                        <div className="rounded-xl bg-white border border-[#4960B2]/15 p-4 space-y-2 text-sm flex-1">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Package</span>
                                <span className="font-bold text-[#4960B2]">{planName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Billing</span>
                                <span className="font-medium text-gray-800">{cycleLabel}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-medium">{formatInr(baseAmount)}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="flex justify-between text-emerald-700">
                                    <span>
                                        Discount
                                        {appliedCoupon?.discountType === 'percentage' ? ` (${appliedCoupon.discountValue}%)` : ''}
                                    </span>
                                    <span className="font-bold">−{formatInr(discountAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between pt-3 border-t border-gray-100 text-base mt-2">
                                <span className="font-bold text-[#1e1e2d]">Total</span>
                                <span className="font-black text-[#4960B2]">{formatInr(finalAmount)}</span>
                            </div>
                        </div>

                        {payError && (
                            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mt-4">{payError}</div>
                        )}

                        <button
                            type="button"
                            disabled={payLoading}
                            onClick={handleSubscribe}
                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#4960B2] to-[#3b4f98] text-white font-black text-sm flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-60 mt-5 cursor-pointer"
                        >
                            <FiLock size={16} />
                            {payLoading
                                ? 'Processing…'
                                : finalAmount <= 0
                                    ? 'Activate subscription'
                                    : `Subscribe — ${formatInr(finalAmount)}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPaymentModal;
