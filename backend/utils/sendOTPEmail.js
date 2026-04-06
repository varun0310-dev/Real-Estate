const nodemailer = require('nodemailer');

const sendOTPEmail = async (to, otp) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    await transporter.sendMail({
        to,
        subject: 'Your OTP Code',
        html: `<p>Your OTP code is <strong>${otp}</strong>. It expires in 10 minutes.</p>`
    });
};

module.exports = sendOTPEmail;