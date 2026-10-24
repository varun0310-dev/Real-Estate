const crypto = require('crypto');
const Razorpay = require('razorpay');
const { getPlansMap } = require('../utils/packagePlans');
const { validateCouponForCheckout } = require('../utils/couponValidation');
const { completeSellerSubscription } = require('./subscriptionController');

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
    }

    if (clientAmount !== undefined && clientAmount !== null) {
        const clientNum = Number(clientAmount);
        if (Number.isNaN(clientNum) || clientNum !== finalAmount) {
            const err = new Error('Payment amount does not match the order total.');
            err.status = 400;
            throw err;
        }
    }

    return { finalAmount, planData, baseAmount };
}

/**
 * POST /api/payments/razorpay/create-order
 * Body: { plan, billingCycle, amount, couponCode? }
 */
exports.createRazorpayOrder = async (req, res) => {
    try {
        if (req.user.userType !== 'seller') {
            return res.status(403).json({ message: 'Only sellers can checkout packages.' });
        }

        const { plan, billingCycle = 'monthly', amount, couponCode } = req.body;
        const { finalAmount, planData } = await resolveCheckoutAmount({
            sellerId: req.user._id,
            plan,
            billingCycle,
            couponCode,
            clientAmount: amount,
        });

        if (finalAmount <= 0) {
            return res.status(400).json({
                message: 'No payment required. Subscribe directly with your coupon.',
                skipPayment: true,
            });
        }

        const { client, keyId } = getRazorpayClient();
        const amountPaise = Math.round(finalAmount * 100);

        const order = await client.orders.create({
            amount: amountPaise,
            currency: 'INR',
            receipt: `sub_${String(req.user._id).slice(-8)}_${Date.now()}`,
            notes: {
                plan,
                billingCycle,
                sellerId: String(req.user._id),
                couponCode: couponCode ? String(couponCode).trim() : '',
            },
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
        console.error('createRazorpayOrder error:', err.message);
        res.status(500).json({ message: 'Could not create payment order.' });
    }
};

/**
 * POST /api/payments/razorpay/verify
 * Body: { plan, billingCycle, amount, couponCode?, razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
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

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: 'Incomplete payment verification data.' });
        }

        const { keySecret } = getRazorpayClient();
        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expected = crypto.createHmac('sha256', keySecret).update(body).digest('hex');

        if (expected !== razorpay_signature) {
            return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
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

        const result = await completeSellerSubscription({
            sellerId: req.user._id,
            plan,
            billingCycle,
            couponCode,
            clientAmountPaid: finalAmount,
        });

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
