const Conversation = require('../models/Conversation');

exports.getAllConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find()
            .populate('propertyId', 'title images price address')
            .populate('sellerId', 'name profileImage companyName')
            .populate('buyerId', 'name profileImage')
            .sort({ lastMessageAt: -1 });
        res.status(200).json({ conversations });
    } catch (err) {
        console.error("Admin get conversations error:", err);
        res.status(500).json({ message: 'Server error' });
    }
};
