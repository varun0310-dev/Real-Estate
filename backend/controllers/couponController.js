const { getPlanByKey } = require('../utils/packagePlans');
const { validateCouponForCheckout } = require('../utils/couponValidation');

/**
 * POST /api/coupons/validate
 * Body: { code, planKey?, billingCycle?, amount? }
 */
exports.validateCoupon = async (req, res) => {
    try {
        if (req.user.userType !== 'seller') {
            return res.status(403).json({ valid: false, message: 'Only sellers can apply checkout coupons.' });
        }

        const { code, planKey, billingCycle = 'monthly', amount } = req.body;

        let baseAmount = Number(amount);
        if ((!baseAmount && baseAmount !== 0) || Number.isNaN(baseAmount)) {
            if (!planKey) {
                return res.status(400).json({ valid: false, message: 'Plan or amount is required to validate a coupon.' });
            }
            const plan = await getPlanByKey(planKey);
            if (!plan) {
                return res.status(400).json({ valid: false, message: 'Invalid plan selected.' });
            }
            baseAmount = billingCycle === 'annual'
                ? (plan.annualPrice || 0)
                : (plan.monthlyPrice || 0);
        }

        const result = await validateCouponForCheckout({
            code,
            sellerId: req.user._id,
            amount: baseAmount,
            planKey,
            billingCycle,
        });

        if (!result.valid) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (err) {
        console.error('validateCoupon error:', err.message);
        res.status(500).json({ valid: false, message: 'Server error' });
    }
};
