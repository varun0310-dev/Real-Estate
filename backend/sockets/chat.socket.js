const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const initializeChatSocket = (io) => {
    // Middleware to authenticate socket connection
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) return next(new Error('Authentication error: No token provided'));

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');
            if (!user) return next(new Error('Authentication error: User not found'));

            socket.user = user;
            next();
        } catch (err) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id} (User: ${socket.user.name})`);

        // Join user's personal room for direct notification broadcasts
        socket.join(`user:${socket.user._id}`);

        // Join conversation room
        socket.on('join_conversation', async (conversationId) => {
            try {
                if (!conversationId) return;

                const conversation = await Conversation.findById(conversationId);
                if (!conversation) return;

                const isParticipant = 
                    conversation.buyerId.toString() === socket.user._id.toString() ||
                    conversation.sellerId.toString() === socket.user._id.toString();
                const isAdmin = socket.user.userType === 'superadmin' || socket.user.role === 'superadmin';

                if (isParticipant || isAdmin) {
                    socket.join(`conversation:${conversationId}`);
                    console.log(`User ${socket.user.name} joined room: conversation:${conversationId}`);
                }
            } catch (err) {
                console.error("Join conversation error:", err);
            }
        });

        // Leave conversation room
        socket.on('leave_conversation', (conversationId) => {
            if (conversationId) {
                socket.leave(`conversation:${conversationId}`);
            }
        });

        // Handle sending a message
        socket.on('send_message', async (data) => {
            try {
                const { conversationId, text, messageType = 'text', attachments = [] } = data;
                
                // Trim and validate text
                if (!text || text.trim() === '') return;

                const conversation = await Conversation.findById(conversationId);
                if (!conversation) return;

                // Determine receiver
                let receiverId = null;
                if (conversation.buyerId.toString() === socket.user._id.toString()) {
                    receiverId = conversation.sellerId;
                    conversation.sellerUnreadCount = (conversation.sellerUnreadCount || 0) + 1;
                } else if (conversation.sellerId.toString() === socket.user._id.toString()) {
                    receiverId = conversation.buyerId;
                    conversation.buyerUnreadCount = (conversation.buyerUnreadCount || 0) + 1;
                } else if (socket.user.userType === 'superadmin' || socket.user.role === 'superadmin') {
                    receiverId = conversation.buyerId;
                } else {
                    // Not a participant
                    return;
                }

                // If conversation was marked deleted/inactive, reactivate it
                if (conversation.isDeleted || conversation.status !== 'active') {
                    conversation.isDeleted = false;
                    conversation.status = 'active';
                }

                // Save message
                const newMessage = new Message({
                    conversationId,
                    senderId: socket.user._id,
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

                // Populate sender details for broadcast
                await newMessage.populate('senderId', 'name profileImage userType');

                // Emit to conversation room AND both personal user rooms for 100% reliable reception
                io.to(`conversation:${conversationId}`).emit('new_message', newMessage);
                io.to(`user:${receiverId}`).emit('new_message', newMessage);
                io.to(`user:${socket.user._id}`).emit('new_message', newMessage);

            } catch (err) {
                console.error("Send message error:", err);
            }
        });

        // Handle typing events
        socket.on('typing', (conversationId) => {
            if (conversationId) {
                socket.to(`conversation:${conversationId}`).emit('typing', {
                    userId: socket.user._id,
                    name: socket.user.name
                });
            }
        });

        socket.on('stop_typing', (conversationId) => {
            if (conversationId) {
                socket.to(`conversation:${conversationId}`).emit('stop_typing', {
                    userId: socket.user._id
                });
            }
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
};

module.exports = { initializeChatSocket };
