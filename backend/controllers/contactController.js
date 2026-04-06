const Contact = require('../models/Contact');
const sendEmail = require('../utils/sendEmail');

exports.submitContactForm = async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ message: 'Name, email, and message are required.' });
        }

        // Save to DB
        const contact = new Contact({ name, email, message });
        await contact.save();

        // Send email to admin
        await sendEmail({
            to: process.env.ADMIN_EMAIL,
            subject: `New Contact Form Submission}`,
            text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
        });

        // Optional: Auto-reply to customer
        await sendEmail({
            to: email,
            subject: `Thank you for contacting us!`,
            text: `Hi ${name},\n\nThanks for reaching out. We'll get back to you shortly!\n\nYour message:\n${message}`
        });

        res.status(200).json({ message: 'Message sent and saved successfully.' });
    } catch (err) {
        console.error('Contact form error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};
