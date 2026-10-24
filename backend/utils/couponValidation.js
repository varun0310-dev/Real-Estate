const Coupon = require('../models/Coupon');

/**
 * Compute discount from base amount. Caps discount at base (never negative total).
 */
function calculateDiscountAmount(baseAmount, discountType, discountValue) {
    const base = Math.max(0, Number(baseAmount) || 0);
    if (base === 0) {
        return { discountAmount: 0, finalAmount: 0 };
    }

    let discountAmount = 0;
    if (discountType === 'percentage') {
        const pct = Math.min(100, Math.max(0, Number(discountValue) || 0));
        discountAmount = Math.round((base * pct) / 100);
    } else {
        discountAmount = Math.max(0, Number(discountValue) || 0);
    }

    discountAmount = Math.min(discountAmount, base);
    const finalAmount = base - discountAmount;
    return { discountAmount, finalAmount };
}

/**
 * Validate coupon for checkout. planKey / billingCycle reserved for future plan-scoped coupons.
 */
async function validateCouponForCheckout({ code, sellerId, amount, planKey, billingCycle }) {
    void planKey;
    void billingCycle;

    const trimmed = (code || '').trim();
    if (!trimmed) {
        return { valid: false, message: 'Please enter a coupon code.' };
    }

    const baseAmount = Math.max(0, Number(amount) || 0);
    if (baseAmount <= 0) {
        return { valid: false, message: 'Invalid order amount for coupon validation.' };
    }

    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const coupon = await Coupon.findOne({ title: new RegExp(`^${escaped}$`, 'i') });
    if (!coupon) {
        return { valid: false, message: 'Invalid coupon code.' };
    }

    if (coupon.status !== 'active') {
        return { valid: false, message: 'This coupon is inactive.' };
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return { valid: false, message: 'This coupon has expired.' };
    }

    if (String(coupon.sellerId) !== String(sellerId)) {
        return { valid: false, message: 'This coupon is not valid for your account.' };
    }

    const { discountAmount, finalAmount } = calculateDiscountAmount(
        baseAmount,
        coupon.discountType,
        coupon.discountValue
    );

    return {
        valid: true,
        message: 'Coupon applied successfully.',
        code: coupon.title,
        couponId: coupon._id,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        baseAmount,
        finalAmount,
    };
}

module.exports = {
    calculateDiscountAmount,
    validateCouponForCheckout,
};
