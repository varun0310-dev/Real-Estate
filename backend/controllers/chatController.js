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
        }).populate('propertyId', 'title images price address propertyType')
          .populate('sellerId', 'name profileImage companyName email phone userType')
          .populate('buyerId', 'name profileImage email phone userType');

        // If conversation existed but was deleted or inactive, restore it
        if (conversation) {
            if (conversation.isDeleted || conversation.status !== 'active') {
                conversation.isDeleted = false;
                conversation.status = 'active';
                await conversation.save();
            }
        } else {
            // Create new conversation
            conversation = new Conversation({
                propertyId,
                buyerId,
                sellerId,
                status: 'active',
                isDeleted: false
            });
            await conversation.save();
            
            // Re-populate for consistency
            conversation = await Conversation.findById(conversation._id)
                .populate('propertyId', 'title images price address propertyType')
                .populate('sellerId', 'name profileImage companyName email phone userType')
                .populate('buyerId', 'name profileImage email phone userType');
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
        
        // User should see all active conversations they participate in (as buyer or seller)
        const query = {
            isDeleted: { $ne: true },
            $or: [
                { buyerId: userId },
                { sellerId: userId }
            ]
        };

        const conversations = await Conversation.find(query)
            .populate('propertyId', 'title images price address propertyType')
            .populate('sellerId', 'name profileImage companyName email userType')
            .populate('buyerId', 'name profileImage email userType')
            .sort({ lastMessageAt: -1, updatedAt: -1 });

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
        const limit = parseInt(req.query.limit) || 50;
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

exports.sendMessage = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { text, messageType = 'text', attachments = [] } = req.body;
        const senderId = req.user._id;

        if (!text || text.trim() === '') {
            return res.status(400).json({ message: 'Message text is required' });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

        // Determine receiver and ensure participant
        let receiverId = null;
        if (conversation.buyerId.toString() === senderId.toString()) {
            receiverId = conversation.sellerId;
            conversation.sellerUnreadCount = (conversation.sellerUnreadCount || 0) + 1;
        } else if (conversation.sellerId.toString() === senderId.toString()) {
            receiverId = conversation.buyerId;
            conversation.buyerUnreadCount = (conversation.buyerUnreadCount || 0) + 1;
        } else if (req.user.userType === 'superadmin' || req.user.role === 'superadmin') {
            // Admin sending on behalf
            receiverId = conversation.buyerId;
        } else {
            return res.status(403).json({ message: 'Not authorized to send messages in this conversation' });
        }

        // If conversation was marked deleted/inactive, reactivate it
        if (conversation.isDeleted || conversation.status !== 'active') {
            conversation.isDeleted = false;
            conversation.status = 'active';
        }

        // Save message
        const newMessage = new Message({
            conversationId,
            senderId,
            receiverId,
            text: text.trim(),
            messageType,
            attachments
        });
        await newMessage.save();

        // Update conversation
        conversation.lastMessage = text.trim().substring(0, 80);
        conversation.lastMessageAt = new Date();
        await conversation.save();

        await newMessage.populate('senderId', 'name profileImage userType');

        // Broadcast via Socket.IO if available
        const io = req.app.get('io');
        if (io) {
            io.to(`conversation:${conversationId}`).emit('new_message', newMessage);
            io.to(`user:${receiverId}`).emit('new_message', newMessage);
            io.to(`user:${senderId}`).emit('new_message', newMessage);
        }

        res.status(201).json({ message: newMessage });
    } catch (err) {
        console.error("Send message error:", err);
        res.status(500).json({ message: 'Server error sending message' });
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
            conversation.sellerUnreadCount = 0;
        }
        await conversation.save();

        res.status(200).json({ message: 'Messages marked as read' });
    } catch (err) {
        console.error("Mark read error:", err);
        res.status(500).json({ message: 'Server error' });
    }
};
