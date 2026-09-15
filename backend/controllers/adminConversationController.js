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

exports.deleteConversation = async (req, res) => {
    try {
        const { id } = req.params;
        const conversation = await Conversation.findById(id);
        
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }
        
        conversation.isDeleted = true;
        conversation.deletedAt = new Date();
        conversation.status = 'deleted';
        
        await conversation.save();
        
        res.status(200).json({ message: 'Conversation deleted successfully', conversation });
    } catch (err) {
        console.error("Admin delete conversation error:", err);
        res.status(500).json({ message: 'Server error' });
    }
};
