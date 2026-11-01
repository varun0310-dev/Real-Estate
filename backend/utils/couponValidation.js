const Coupon = require('../models/Coupon');
require('../models/User');

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
 * Validate coupon for checkout with referral program rules and package conditions.
 */
async function validateCouponForCheckout({ code, sellerId, amount, planKey, billingCycle }) {
    void billingCycle;

    const trimmed = (code || '').trim();
    if (!trimmed) {
        return { valid: false, message: 'Please enter a coupon code.' };
    }

    const baseAmount = Math.max(0, Number(amount) || 0);
    if (baseAmount <= 0) {
        return { valid: false, message: 'Coupons cannot be applied to free packages.' };
    }

    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const coupon = await Coupon.findOne({ title: new RegExp(`^${escaped}$`, 'i') })
        .populate('sellerId', 'name email companyName');

    if (!coupon) {
        return { valid: false, message: 'Invalid coupon code.' };
    }

    // Status condition
    if (coupon.status !== 'active') {
        return { valid: false, message: 'This coupon is inactive.' };
    }

    // Expiry date condition
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return { valid: false, message: 'This coupon has expired.' };
    }

    // Referral Program validation:
    // A referral coupon is created for a seller (referrer). When ANY OTHER seller subscribes,
    // they get the discount. The referring seller CANNOT use their own coupon on themselves.
    const isReferral = !coupon.couponType || coupon.couponType === 'referral';
    const referrerId = coupon.sellerId?._id ? String(coupon.sellerId._id) : String(coupon.sellerId);

    if (isReferral && referrerId && referrerId === String(sellerId)) {
        return { valid: false, message: 'You cannot use your own referral coupon code.' };
    }

    // Package / Plan condition
    if (planKey === 'basic') {
        return { valid: false, message: 'Coupons cannot be applied to the Basic (Free) package.' };
    }
    if (coupon.applicablePlans && coupon.applicablePlans.length > 0 && planKey) {
        if (!coupon.applicablePlans.includes(planKey)) {
            const planNames = coupon.applicablePlans
                .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
                .join(' or ');
            return { valid: false, message: `This coupon is only valid for ${planNames} packages.` };
        }
    }

    // Minimum package amount condition
    if (coupon.minPurchaseAmount && coupon.minPurchaseAmount > 0) {
        if (baseAmount < coupon.minPurchaseAmount) {
            return {
                valid: false,
                message: `Minimum package amount of ₹${coupon.minPurchaseAmount.toLocaleString('en-IN')} required to apply this coupon.`,
            };
        }
    }

    // Total max usage limit condition
    if (coupon.maxUses && coupon.maxUses > 0) {
        if (coupon.usageCount >= coupon.maxUses) {
            return { valid: false, message: 'This coupon has reached its maximum usage limit.' };
        }
    }

    // Per-seller usage limit condition
    const maxPerSeller = coupon.maxUsesPerSeller || 1;
    if (coupon.usedBy && coupon.usedBy.length > 0) {
        const sellerUses = coupon.usedBy.filter((u) => String(u.seller) === String(sellerId)).length;
        if (sellerUses >= maxPerSeller) {
            return { valid: false, message: 'You have already redeemed this referral coupon.' };
        }
    }

    const { discountAmount, finalAmount } = calculateDiscountAmount(
        baseAmount,
        coupon.discountType,
        coupon.discountValue
    );

    const referrerName = coupon.sellerId?.name || 'Referred Partner';

    return {
        valid: true,
        message: isReferral && coupon.sellerId?.name
            ? `Referral coupon applied! (Referred by ${referrerName})`
            : 'Coupon applied successfully.',
        code: coupon.title,
        couponId: coupon._id,
        referrerSellerId: coupon.sellerId?._id || coupon.sellerId,
        referrerName,
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
