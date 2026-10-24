const Subscription = require('../models/Subscription');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const sendEmail = require('../utils/sendEmail');
const { getSubscriptionWelcomeEmail, getSubscriptionExpiryEmail } = require('../utils/subscriptionEmails');
const { getPlansMap, getPlanByKey } = require('../utils/packagePlans');
const { validateCouponForCheckout } = require('../utils/couponValidation');

/**
 * Auto-subscribe a seller to Basic (Free) plan on signup / profile update to seller.
 * Safe to call multiple times — won't create duplicate active subscriptions.
 */
const assignBasicPlan = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user || user.userType !== 'seller') return;

        // Check for existing active subscription
        const existing = await Subscription.findOne({
            seller: userId,
            status: 'active',
        });
        if (existing) return; // already has active plan

        const plan = await getPlanByKey('basic', { includeInactive: true });
        if (!plan) return;
        const startDate = new Date();
        const expiryDate = new Date(startDate);
        expiryDate.setDate(expiryDate.getDate() + plan.durationDays);

        const subscription = new Subscription({
            seller: userId,
            plan: 'basic',
            billingCycle: 'monthly',
            status: 'active',
            startDate,
            expiryDate,
            amountPaid: 0,
        });
        await subscription.save();

        // Send welcome email
        const { subject, html } = getSubscriptionWelcomeEmail({
            name: user.name,
            plan,
            expiryDate,
        });
        await sendEmail({ to: user.email, subject, html });

        console.log(`✅ Basic plan assigned to seller ${user.email}, expires ${expiryDate.toDateString()}`);
        return subscription;
    } catch (err) {
        console.error('assignBasicPlan error:', err.message);
    }
};

/**
 * GET /api/subscriptions/my  — Get current seller's active subscription
 */
exports.getMySubscription = async (req, res) => {
    try {
        const sub = await Subscription.findOne({
            seller: req.user._id,
            status: 'active',
        }).sort({ createdAt: -1 });

        // Also check if any expired ones to return last known
        const lastSub = sub || await Subscription.findOne({
            seller: req.user._id,
        }).sort({ createdAt: -1 });

        if (!lastSub) {
            return res.status(404).json({ message: 'No subscription found' });
        }

        const plans = await getPlansMap();

        return res.status(200).json({
            subscription: lastSub,
            plans,
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/**
 * Shared checkout fulfillment after payment (or zero-amount subscribe).
 */
async function completeSellerSubscription({
    sellerId,
    plan,
    billingCycle = 'monthly',
    couponCode,
    clientAmountPaid,
}) {
    const user = await User.findById(sellerId);
    if (!user || user.userType !== 'seller') {
        const err = new Error('Only seller accounts can subscribe to packages.');
        err.status = 403;
        throw err;
    }

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

    let amountPaid = baseAmount;
    let appliedCouponCode = null;
    let couponId = null;

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
        amountPaid = validation.finalAmount;
        appliedCouponCode = validation.code;
        couponId = validation.couponId;
    }

    if (clientAmountPaid !== undefined && clientAmountPaid !== null) {
        const clientNum = Number(clientAmountPaid);
        if (Number.isNaN(clientNum) || clientNum !== amountPaid) {
            const err = new Error('Payment amount does not match the order total. Please refresh checkout and try again.');
            err.status = 400;
            throw err;
        }
    }

    await Subscription.updateMany(
        { seller: sellerId, status: 'active' },
        { status: 'cancelled' }
    );

    const startDate = new Date();
    const expiryDate = new Date(startDate);
    expiryDate.setDate(expiryDate.getDate() + planData.durationDays);

    const subscription = new Subscription({
        seller: sellerId,
        plan,
        billingCycle,
        status: 'active',
        startDate,
        expiryDate,
        amountPaid,
        couponCode: appliedCouponCode,
    });
    await subscription.save();

    if (couponId) {
        await Coupon.findByIdAndUpdate(couponId, { $inc: { usageCount: 1 } });
    }

    const { subject, html } = getSubscriptionWelcomeEmail({
        name: user.name,
        plan: planData,
        expiryDate,
    });
    await sendEmail({ to: user.email, subject, html });

    return {
        message: `Successfully subscribed to ${planData.name}`,
        subscription,
        planData,
    };
}

exports.completeSellerSubscription = completeSellerSubscription;

/**
 * POST /api/subscriptions/subscribe  — Seller subscribes to a plan
 * Body: { plan, billingCycle, couponCode?, amountPaid? }
 */
exports.subscribe = async (req, res) => {
    try {
        const { plan, billingCycle = 'monthly', couponCode, amountPaid: clientAmountPaid } = req.body;
        const result = await completeSellerSubscription({
            sellerId: req.user._id,
            plan,
            billingCycle,
            couponCode,
            clientAmountPaid,
        });
        res.status(201).json({
            message: result.message,
            subscription: result.subscription,
        });
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ message: err.message });
        }
        console.error('subscribe error:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/**
 * GET /api/subscriptions/plans  — Return available plans (public)
 */
exports.getPlans = async (req, res) => {
    try {
        const plans = await getPlansMap();
        res.status(200).json({ plans });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/**
 * GET /api/subscriptions/check  — Check if seller has active subscription (used by property guards)
 */
exports.checkSubscription = async (req, res) => {
    try {
        const sub = await Subscription.findOne({
            seller: req.user._id,
            status: 'active',
            expiryDate: { $gt: new Date() },
        });

        return res.status(200).json({
            hasActiveSubscription: !!sub,
            subscription: sub || null,
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Export for cron & controller use
exports.assignBasicPlan = assignBasicPlan;
