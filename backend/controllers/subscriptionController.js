const Subscription = require('../models/Subscription');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { getSubscriptionWelcomeEmail, getSubscriptionExpiryEmail } = require('../utils/subscriptionEmails');

const PLANS = Subscription.PLANS;

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

        const plan = PLANS.basic;
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

        return res.status(200).json({
            subscription: lastSub,
            plans: PLANS,
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/**
 * POST /api/subscriptions/subscribe  — Seller subscribes to a plan
 * Body: { plan: 'standard'|'premium', billingCycle: 'monthly'|'annual' }
 */
exports.subscribe = async (req, res) => {
    try {
        const { plan, billingCycle = 'monthly' } = req.body;
        const sellerId = req.user._id;

        if (!PLANS[plan]) {
            return res.status(400).json({ message: 'Invalid plan selected' });
        }

        const planData = PLANS[plan];

        // Expire any current active subscription
        await Subscription.updateMany(
            { seller: sellerId, status: 'active' },
            { status: 'cancelled' }
        );

        const startDate = new Date();
        const expiryDate = new Date(startDate);
        expiryDate.setDate(expiryDate.getDate() + planData.durationDays);

        const amountPaid = billingCycle === 'annual'
            ? (planData.annualPrice || 0)
            : (planData.monthlyPrice || 0);

        const subscription = new Subscription({
            seller: sellerId,
            plan,
            billingCycle,
            status: 'active',
            startDate,
            expiryDate,
            amountPaid,
        });
        await subscription.save();

        const user = await User.findById(sellerId);
        const { subject, html } = getSubscriptionWelcomeEmail({
            name: user.name,
            plan: planData,
            expiryDate,
        });
        await sendEmail({ to: user.email, subject, html });

        res.status(201).json({
            message: `Successfully subscribed to ${planData.name}`,
            subscription,
        });
    } catch (err) {
        console.error('subscribe error:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/**
 * GET /api/subscriptions/plans  — Return available plans (public)
 */
exports.getPlans = async (req, res) => {
    res.status(200).json({ plans: PLANS });
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
exports.PLANS = PLANS;
