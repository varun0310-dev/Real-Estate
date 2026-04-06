const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text, html }) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'Gmail', // or 'SendGrid', 'Mailgun', etc.
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: `"Your Site" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html
        });

        console.log('Email sent to:', to);
    } catch (err) {
        console.error('Email send error:', err.message);
    }
};

module.exports = sendEmail;
