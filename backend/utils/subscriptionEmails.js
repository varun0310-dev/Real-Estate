/**
 * Email templates for subscription-related notifications.
 */

const getSubscriptionWelcomeEmail = ({ name, plan, expiryDate }) => {
    const formattedExpiry = new Date(expiryDate).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
    });

    return {
        subject: `Welcome! Your ${plan.name} Package is Active`,
        html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,sans-serif;">
          <div style="max-width:600px;margin:30px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(73,96,178,0.1);">
            <div style="background:linear-gradient(135deg,#4960B2,#3b4f98);padding:40px 40px 30px;">
              <h1 style="color:#fff;margin:0;font-size:26px;">🎉 Subscription Activated!</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">Your real estate journey starts now.</p>
            </div>
            <div style="padding:36px 40px;">
              <p style="color:#1e1e2d;font-size:16px;">Hi <strong>${name}</strong>,</p>
              <p style="color:#555;font-size:15px;line-height:1.7;">
                Great news! You have been subscribed to the <strong>${plan.name}</strong> package.
                Here are your subscription details:
              </p>
              <div style="background:#f8fafc;border-radius:12px;padding:24px;margin:24px 0;border-left:4px solid #4960B2;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="padding:8px 0;color:#888;font-size:14px;width:40%;">Package</td>
                    <td style="padding:8px 0;color:#1e1e2d;font-weight:bold;font-size:14px;">${plan.name}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#888;font-size:14px;">Duration</td>
                    <td style="padding:8px 0;color:#1e1e2d;font-weight:bold;font-size:14px;">${plan.durationDays} Days</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#888;font-size:14px;">Visibility</td>
                    <td style="padding:8px 0;color:#1e1e2d;font-weight:bold;font-size:14px;">${plan.visibility}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#888;font-size:14px;">Monthly Price</td>
                    <td style="padding:8px 0;color:#4960B2;font-weight:bold;font-size:16px;">₹${plan.monthlyPrice.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#888;font-size:14px;">Valid Until</td>
                    <td style="padding:8px 0;color:#1e1e2d;font-weight:bold;font-size:14px;">${formattedExpiry}</td>
                  </tr>
                </table>
              </div>
              <p style="color:#555;font-size:14px;line-height:1.7;">
                You can now list and manage your properties on the platform. 
                Log in to your dashboard to get started!
              </p>
              <div style="text-align:center;margin:30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/my-properties" 
                   style="background:linear-gradient(135deg,#4960B2,#3b4f98);color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;">
                  Go to Dashboard
                </a>
              </div>
            </div>
            <div style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
              <p style="color:#aaa;font-size:12px;margin:0;">© ${new Date().getFullYear()} Real Estate Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
        `
    };
};

const getSubscriptionExpiryEmail = ({ name, plan, expiryDate }) => {
    const formattedExpiry = new Date(expiryDate).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
    });

    return {
        subject: `⚠️ Your ${plan.name} Package Has Expired`,
        html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,sans-serif;">
          <div style="max-width:600px;margin:30px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(73,96,178,0.1);">
            <div style="background:linear-gradient(135deg,#e53e3e,#c53030);padding:40px 40px 30px;">
              <h1 style="color:#fff;margin:0;font-size:26px;">⚠️ Package Expired</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">Your subscription has come to an end.</p>
            </div>
            <div style="padding:36px 40px;">
              <p style="color:#1e1e2d;font-size:16px;">Hi <strong>${name}</strong>,</p>
              <p style="color:#555;font-size:15px;line-height:1.7;">
                Your <strong>${plan.name}</strong> subscription expired on <strong>${formattedExpiry}</strong>.
                Your property listings are now hidden and you cannot add, edit, or delete properties until you renew.
              </p>
              <div style="background:#fff5f5;border-radius:12px;padding:20px;margin:24px 0;border-left:4px solid #e53e3e;">
                <p style="color:#c53030;margin:0;font-size:14px;font-weight:bold;">
                  🔒 Your account is currently restricted. Renew your package to restore access.
                </p>
              </div>
              <p style="color:#555;font-size:14px;margin-bottom:8px;font-weight:bold;">Upgrade to enjoy more benefits:</p>
              <ul style="color:#555;font-size:14px;line-height:2;padding-left:20px;">
                <li><strong>Standard (Verified)</strong> — ₹2,999/mo · 60 Days · 2x Boost</li>
                <li><strong>Premium (Gold)</strong> — ₹6,999/mo · 90 Days · 5x Boost</li>
              </ul>
              <div style="text-align:center;margin:30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/pricing" 
                   style="background:linear-gradient(135deg,#4960B2,#3b4f98);color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;">
                  Renew / Upgrade Package
                </a>
              </div>
            </div>
            <div style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
              <p style="color:#aaa;font-size:12px;margin:0;">© ${new Date().getFullYear()} Real Estate Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
        `
    };
};

module.exports = { getSubscriptionWelcomeEmail, getSubscriptionExpiryEmail };
