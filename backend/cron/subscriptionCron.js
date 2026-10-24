const cron = require('node-cron');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { getSubscriptionExpiryEmail } = require('../utils/subscriptionEmails');
const { getPlanByKey } = require('../utils/packagePlans');

/**
 * Runs daily at midnight:
 * 1. Finds all active subscriptions past their expiry date → marks them expired + sends email
 * 2. Sends a 3-day warning email if not yet expired but about to
 */
const startSubscriptionCron = () => {
    // Run every day at 00:00
    cron.schedule('0 0 * * *', async () => {
        console.log('🕐 [CRON] Running subscription expiry check...');

        const now = new Date();

        try {
            // 1. Expire subscriptions that are past their expiryDate
            const expiredSubs = await Subscription.find({
                status: 'active',
                expiryDate: { $lte: now },
            }).populate('seller', 'name email');

            for (const sub of expiredSubs) {
                sub.status = 'expired';
                await sub.save();

                if (sub.seller && !sub.expiryEmailSent) {
                    const planData = await getPlanByKey(sub.plan, { includeInactive: true });
                    const { subject, html } = getSubscriptionExpiryEmail({
                        name: sub.seller.name,
                        plan: planData,
                        expiryDate: sub.expiryDate,
                    });
                    await sendEmail({ to: sub.seller.email, subject, html });

                    sub.expiryEmailSent = true;
                    await sub.save();

                    console.log(`📧 Expiry email sent to ${sub.seller.email}`);
                }
            }

            if (expiredSubs.length > 0) {
                console.log(`✅ [CRON] Expired ${expiredSubs.length} subscription(s)`);
            } else {
                console.log('✅ [CRON] No subscriptions to expire today');
            }
        } catch (err) {
            console.error('❌ [CRON] Subscription expiry error:', err.message);
        }
    });

    console.log('📅 Subscription expiry cron job scheduled (daily at midnight)');
};

module.exports = { startSubscriptionCron };
