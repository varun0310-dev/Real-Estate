const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Property = require('../models/Property');

exports.createOrGetConversation = async (req, res) => {
    try {
        const { propertyId } = req.body;
        const buyerId = req.user._id;

        // Ensure property exists and get seller
        const property = await Property.findById(propertyId);
        if (!property) return res.status(404).json({ message: 'Property not found' });
        
        const sellerId = property.seller;
        
        // Cannot chat with yourself
        if (buyerId.toString() === sellerId.toString()) {
            return res.status(400).json({ message: 'Cannot chat with yourself regarding your own property.' });
        }

        // Find existing conversation
        let conversation = await Conversation.findOne({
            propertyId,
            buyerId,
            sellerId
        }).populate('propertyId', 'title images price')
          .populate('sellerId', 'name profileImage companyName')
          .populate('buyerId', 'name profileImage');

        // Create new if not exists
        if (!conversation) {
            conversation = new Conversation({
                propertyId,
                buyerId,
                sellerId
            });
            await conversation.save();
            
            // Re-populate for consistency
            conversation = await Conversation.findById(conversation._id)
                .populate('propertyId', 'title images price')
                .populate('sellerId', 'name profileImage companyName')
                .populate('buyerId', 'name profileImage');
        }

        res.status(200).json({ conversation });
    } catch (err) {
        console.error("Create conversation error:", err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getMyConversations = async (req, res) => {
    try {
        const userId = req.user._id;
        const userType = req.user.userType;
        
        let query = {};
        
        if (userType === 'buyer') {
            // Buyer: show only conversations they started
            query.buyerId = userId;
        } else if (userType === 'seller' || userType === 'superadmin') {
            // Sellers AND admins (who post properties) appear as the seller in conversations
            query.sellerId = userId;
        } else {
            return res.status(403).json({ message: 'Invalid user type for chat' });
        }

        const conversations = await Conversation.find(query)
            .populate('propertyId', 'title images price address')
            .populate('sellerId', 'name profileImage companyName userType')
            .populate('buyerId', 'name profileImage userType')
            .sort({ lastMessageAt: -1 });

        res.status(200).json({ conversations });
    } catch (err) {
        console.error("Get conversations error:", err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 30;
        const skip = (page - 1) * limit;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

        // Authorization check
        const isParticipant = 
            conversation.buyerId.toString() === req.user._id.toString() ||
            conversation.sellerId.toString() === req.user._id.toString();
        const isAdmin = req.user.userType === 'superadmin' || req.user.role === 'superadmin';

        if (!isParticipant && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to view these messages' });
        }

        const messages = await Message.find({ conversationId })
            .populate('senderId', 'name profileImage userType')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Reverse to send oldest first for the chat UI
        messages.reverse();

        res.status(200).json({ messages, page, limit });
    } catch (err) {
        console.error("Get messages error:", err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.markMessagesRead = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

        // Update messages where receiver is current user and isRead is false
        await Message.updateMany(
            { conversationId, receiverId: userId, isRead: false },
            { $set: { isRead: true, readAt: new Date() } }
        );

        // Reset unread count on conversation
        if (conversation.buyerId.toString() === userId.toString()) {
            conversation.buyerUnreadCount = 0;
        } else if (conversation.sellerId.toString() === userId.toString()) {
            // Covers both seller and superadmin who posted the property
            conversation.sellerUnreadCount = 0;
        }
        await conversation.save();

        res.status(200).json({ message: 'Messages marked as read' });
    } catch (err) {
        console.error("Mark read error:", err);
        res.status(500).json({ message: 'Server error' });
    }
};
