const crypto = require('crypto');
const Razorpay = require('razorpay');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const { getPlansMap } = require('../utils/packagePlans');
const { validateCouponForCheckout } = require('../utils/couponValidation');
const { completeSellerSubscription } = require('./subscriptionController');

/* ────────────────────────────────────────────
   Razorpay client helper
   ──────────────────────────────────────────── */
function getRazorpayClient() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
        const err = new Error('Razorpay is not configured on the server.');
        err.status = 503;
        throw err;
    }
    return {
        client: new Razorpay({ key_id: keyId, key_secret: keySecret }),
        keyId,
        keySecret,
    };
}

/* ────────────────────────────────────────────
   Server-side amount resolution (single source of truth)
   ──────────────────────────────────────────── */
async function resolveCheckoutAmount({ sellerId, plan, billingCycle, couponCode, clientAmount }) {
    const plans = await getPlansMap();
    if (!plans[plan]) {
        const err = new Error('Invalid or inactive plan selected');
        err.status = 400;
        throw err;
    }

    const planData = plans[plan];
    const baseAmount = billingCycle === 'annual'
        ? (planData.annualPrice || 0)
        : (planData.monthlyPrice || 0);

    let finalAmount = baseAmount;
    let couponMeta = null;

    if (couponCode && String(couponCode).trim()) {
        const validation = await validateCouponForCheckout({
            code: couponCode,
            sellerId,
            amount: baseAmount,
            planKey: plan,
            billingCycle,
        });
        if (!validation.valid) {
            const err = new Error(validation.message);
            err.status = 400;
            throw err;
        }
        finalAmount = validation.finalAmount;
        couponMeta = {
            code: validation.code,
            couponId: validation.couponId,
            discountType: validation.discountType,
            discountValue: validation.discountValue,
            discountAmount: validation.discountAmount,
        };
    }

    // Validate client-sent amount matches server calculation
    if (clientAmount !== undefined && clientAmount !== null) {
        const clientNum = Number(clientAmount);
        if (Number.isNaN(clientNum) || clientNum !== finalAmount) {
            const err = new Error('Payment amount does not match the order total.');
            err.status = 400;
            throw err;
        }
    }

    return { finalAmount, planData, baseAmount, couponMeta };
}

/* ────────────────────────────────────────────
   POST /api/payments/razorpay/create-order
   Security: auth, seller-only, server-side amount, rate-limited
   ──────────────────────────────────────────── */
exports.createRazorpayOrder = async (req, res) => {
    try {
        if (req.user.userType !== 'seller') {
            return res.status(403).json({ message: 'Only sellers can checkout packages.' });
        }

        const { plan, billingCycle = 'monthly', amount, couponCode } = req.body;

        // Input validation
        if (!plan || !['standard', 'premium'].includes(plan)) {
            return res.status(400).json({ message: 'Invalid plan selected.' });
        }
        if (!['monthly', 'annual'].includes(billingCycle)) {
            return res.status(400).json({ message: 'Invalid billing cycle.' });
        }

        const { finalAmount, planData, baseAmount, couponMeta } = await resolveCheckoutAmount({
            sellerId: req.user._id,
            plan,
            billingCycle,
            couponCode,
            clientAmount: amount,
        });

        if (finalAmount <= 0) {
            return res.status(200).json({
                message: 'No payment required. Subscribe directly with your coupon.',
                skipPayment: true,
            });
        }

        const { client, keyId } = getRazorpayClient();
        const amountPaise = Math.round(finalAmount * 100);
        const receipt = `sub_${String(req.user._id).slice(-8)}_${Date.now()}`;

        const order = await client.orders.create({
            amount: amountPaise,
            currency: 'INR',
            receipt,
            notes: {
                plan,
                billingCycle,
                sellerId: String(req.user._id),
                couponCode: couponCode ? String(couponCode).trim() : '',
            },
        });

        // Persist payment record with status "created"
        await Payment.create({
            seller: req.user._id,
            razorpayOrderId: order.id,
            plan,
            planName: planData.name,
            billingCycle,
            baseAmount,
            discountAmount: couponMeta?.discountAmount || 0,
            finalAmount,
            currency: 'INR',
            couponCode: couponMeta?.code || null,
            couponDiscountType: couponMeta?.discountType || null,
            couponDiscountValue: couponMeta?.discountValue || null,
            status: 'created',
            receipt,
        });

        res.status(200).json({
            orderId: order.id,
            amount: amountPaise,
            currency: order.currency || 'INR',
            keyId,
            planName: planData.name,
        });
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ message: err.message });
        }
        const rzpMsg = err.error?.description || err.description;
        console.error('createRazorpayOrder error:', rzpMsg || err.message);
        res.status(500).json({ message: rzpMsg || err.message || 'Could not create payment order.' });
    }
};

/* ────────────────────────────────────────────
   POST /api/payments/razorpay/verify
   Security: signature verification, idempotency, server-side amount
   ──────────────────────────────────────────── */
exports.verifyRazorpayPayment = async (req, res) => {
    try {
        if (req.user.userType !== 'seller') {
            return res.status(403).json({ message: 'Only sellers can checkout packages.' });
        }

        const {
            plan,
            billingCycle = 'monthly',
            amount,
            couponCode,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body;

        // ── Validate required Razorpay fields ──
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: 'Incomplete payment verification data.' });
        }

        const paidByPaymentId = await Payment.findOne({
            razorpayPaymentId: razorpay_payment_id,
            status: 'paid',
        });
        if (paidByPaymentId) {
            return res.status(200).json({
                message: 'Payment already verified.',
                subscription: await Subscription.findById(paidByPaymentId.subscription),
            });
        }

        // ── Idempotency: check if this order was already verified ──
        const existingPayment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
        if (existingPayment && existingPayment.status === 'paid') {
            return res.status(200).json({
                message: 'Payment already verified.',
                subscription: await Subscription.findById(existingPayment.subscription),
            });
        }

        // ── Verify the payment belongs to this seller ──
        if (existingPayment && String(existingPayment.seller) !== String(req.user._id)) {
            return res.status(403).json({ message: 'Order does not belong to this account.' });
        }

        // ── Cryptographic signature verification ──
        const { keySecret, client } = getRazorpayClient();
        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expected = crypto.createHmac('sha256', keySecret).update(body).digest('hex');

        if (expected !== razorpay_signature) {
            // Mark payment as failed
            if (existingPayment) {
                existingPayment.status = 'failed';
                existingPayment.razorpayPaymentId = razorpay_payment_id;
                await existingPayment.save();
            }
            return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
        }

        // ── Server-side amount verification against Razorpay API ──
        let razorpayOrder;
        try {
            razorpayOrder = await client.orders.fetch(razorpay_order_id);
        } catch (fetchErr) {
            console.error('Razorpay order fetch error:', fetchErr.message);
        }

        const { finalAmount } = await resolveCheckoutAmount({
            sellerId: req.user._id,
            plan,
            billingCycle,
            couponCode,
            clientAmount: amount,
        });

        if (finalAmount <= 0) {
            return res.status(400).json({ message: 'Invalid paid amount for this order.' });
        }

        // Cross-check Razorpay order amount with our calculated amount
        if (razorpayOrder) {
            const razorpayAmountRupees = razorpayOrder.amount / 100;
            if (razorpayAmountRupees !== finalAmount) {
                if (existingPayment) {
                    existingPayment.status = 'failed';
                    existingPayment.razorpayPaymentId = razorpay_payment_id;
                    existingPayment.notes = { error: 'Amount mismatch with Razorpay order' };
                    await existingPayment.save();
                }
                return res.status(400).json({ message: 'Payment amount mismatch detected.' });
            }
        }

        // ── Complete subscription ──
        const result = await completeSellerSubscription({
            sellerId: req.user._id,
            plan,
            billingCycle,
            couponCode,
            clientAmountPaid: finalAmount,
        });

        // ── Update payment record ──
        if (existingPayment) {
            existingPayment.razorpayPaymentId = razorpay_payment_id;
            existingPayment.razorpaySignature = razorpay_signature;
            existingPayment.status = 'paid';
            existingPayment.paidAt = new Date();
            existingPayment.subscription = result.subscription._id;
            await existingPayment.save();
        } else {
            // Fallback: create payment record if somehow missing
            const plans = await getPlansMap();
            const planData = plans[plan];
            await Payment.create({
                seller: req.user._id,
                subscription: result.subscription._id,
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                plan,
                planName: planData?.name || plan,
                billingCycle,
                baseAmount: finalAmount,
                discountAmount: 0,
                finalAmount,
                status: 'paid',
                paidAt: new Date(),
            });
        }

        res.status(201).json({
            message: result.message,
            subscription: result.subscription,
        });
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ message: err.message });
        }
        console.error('verifyRazorpayPayment error:', err.message);
        res.status(500).json({ message: 'Payment verification failed.' });
    }
};

/* ────────────────────────────────────────────
   GET /api/payments/my-transactions
   Seller's own transaction history
   ──────────────────────────────────────────── */
exports.getMyTransactions = async (req, res) => {
    try {
        if (req.user.userType !== 'seller') {
            return res.status(403).json({ message: 'Only sellers can view transactions.' });
        }

        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        const filter = { seller: req.user._id, status: { $in: ['paid', 'refunded'] } };

        const [transactions, total] = await Promise.all([
            Payment.find(filter)
                .sort({ paidAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('subscription', 'plan billingCycle status startDate expiryDate')
                .lean(),
            Payment.countDocuments(filter),
        ]);

        res.status(200).json({
            transactions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        console.error('getMyTransactions error:', err.message);
        res.status(500).json({ message: 'Could not load transactions.' });
    }
};

/* ────────────────────────────────────────────
   GET /api/payments/invoice/:paymentId
   Generate invoice data for a specific payment (owner or admin)
   ──────────────────────────────────────────── */
exports.getInvoice = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.paymentId)
            .populate('seller', 'name email phone companyName address city state zipCode')
            .populate('subscription', 'plan billingCycle status startDate expiryDate')
            .lean();

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found.' });
        }

        // Only the owner or superadmin can access the invoice
        const isOwner = String(payment.seller._id) === String(req.user._id);
        const isAdmin = req.user.userType === 'superadmin';
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        res.status(200).json({ payment });
    } catch (err) {
        console.error('getInvoice error:', err.message);
        res.status(500).json({ message: 'Could not load invoice.' });
    }
};

/* ────────────────────────────────────────────
   GET /api/payments/admin/all
   Super admin: all payments with seller info
   ──────────────────────────────────────────── */
exports.getAllPayments = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 15));
        const skip = (page - 1) * limit;

        const filter = {};
        // Optional filters
        if (req.query.status) filter.status = req.query.status;
        if (req.query.plan) filter.plan = req.query.plan;
        if (req.query.seller) filter.seller = req.query.seller;

        // Search by invoice number
        if (req.query.search) {
            const s = req.query.search.trim();
            filter.$or = [
                { invoiceNumber: { $regex: s, $options: 'i' } },
                { razorpayPaymentId: { $regex: s, $options: 'i' } },
                { razorpayOrderId: { $regex: s, $options: 'i' } },
            ];
        }

        const [payments, total] = await Promise.all([
            Payment.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('seller', 'name email phone companyName profileImage userType')
                .populate('subscription', 'plan billingCycle status startDate expiryDate')
                .lean(),
            Payment.countDocuments(filter),
        ]);

        // Summary stats
        const stats = await Payment.aggregate([
            { $match: { status: 'paid' } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$finalAmount' },
                    totalTransactions: { $sum: 1 },
                    avgTransactionValue: { $avg: '$finalAmount' },
                },
            },
        ]);

        res.status(200).json({
            payments,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
            stats: stats[0] || { totalRevenue: 0, totalTransactions: 0, avgTransactionValue: 0 },
        });
    } catch (err) {
        console.error('getAllPayments error:', err.message);
        res.status(500).json({ message: 'Could not load payments.' });
    }
};

/* ────────────────────────────────────────────
   GET /api/payments/admin/subscriptions
   Super admin: all active/historical subscriptions with seller info
   ──────────────────────────────────────────── */
exports.getAllSubscriptions = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 15));
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.plan) filter.plan = req.query.plan;

        // Search by seller name or email
        if (req.query.search) {
            const users = await User.find({
                $or: [
                    { name: { $regex: req.query.search, $options: 'i' } },
                    { email: { $regex: req.query.search, $options: 'i' } },
                ],
                userType: 'seller',
            }).select('_id');
            filter.seller = { $in: users.map((u) => u._id) };
        }

        const [subscriptions, total] = await Promise.all([
            Subscription.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('seller', 'name email phone companyName profileImage')
                .lean(),
            Subscription.countDocuments(filter),
        ]);

        // Enrich each subscription with its latest payment info
        const sellerIds = [...new Set(subscriptions.map((s) => String(s.seller?._id || s.seller)))];
        const payments = await Payment.find({
            seller: { $in: sellerIds },
            status: 'paid',
        }).sort({ paidAt: -1 }).lean();

        const paymentMap = {};
        for (const p of payments) {
            const key = `${p.seller}_${p.plan}_${p.billingCycle}`;
            if (!paymentMap[key]) paymentMap[key] = p;
        }

        const enriched = subscriptions.map((sub) => {
            const key = `${sub.seller?._id || sub.seller}_${sub.plan}_${sub.billingCycle}`;
            return { ...sub, payment: paymentMap[key] || null };
        });

        // Summary stats
        const planCounts = await Subscription.aggregate([
            { $match: { status: 'active' } },
            { $group: { _id: '$plan', count: { $sum: 1 } } },
        ]);

        res.status(200).json({
            subscriptions: enriched,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
            planCounts: planCounts.reduce((acc, { _id, count }) => ({ ...acc, [_id]: count }), {}),
        });
    } catch (err) {
        console.error('getAllSubscriptions error:', err.message);
        res.status(500).json({ message: 'Could not load subscriptions.' });
    }
};
