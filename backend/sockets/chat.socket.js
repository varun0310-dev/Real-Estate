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

        // Join conversation room
        socket.on('join_conversation', async (conversationId) => {
            try {
                // Verify user belongs to this conversation or is admin
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
            socket.leave(`conversation:${conversationId}`);
        });

        // Handle sending a message
        socket.on('send_message', async (data) => {
            try {
                const { conversationId, text, messageType = 'text', attachments = [] } = data;
                
                // Trim and validate text
                if (!text || text.trim() === '') return;

                const conversation = await Conversation.findById(conversationId);
                if (!conversation || conversation.status !== 'active') return;

                // Determine receiver
                let receiverId = null;
                if (conversation.buyerId.toString() === socket.user._id.toString()) {
                    receiverId = conversation.sellerId;
                    conversation.sellerUnreadCount += 1;
                } else if (conversation.sellerId.toString() === socket.user._id.toString()) {
                    receiverId = conversation.buyerId;
                    conversation.buyerUnreadCount += 1;
                } else {
                    // Not a participant
                    return;
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
                conversation.lastMessage = text.trim().substring(0, 50);
                conversation.lastMessageAt = new Date();
                await conversation.save();

                // Populate sender details for the broadcast
                await newMessage.populate('senderId', 'name profileImage userType');

                // Emit to room
                io.to(`conversation:${conversationId}`).emit('new_message', newMessage);

            } catch (err) {
                console.error("Send message error:", err);
            }
        });

        // Handle typing events
        socket.on('typing', (conversationId) => {
            socket.to(`conversation:${conversationId}`).emit('typing', {
                userId: socket.user._id,
                name: socket.user.name
            });
        });

        socket.on('stop_typing', (conversationId) => {
            socket.to(`conversation:${conversationId}`).emit('stop_typing', {
                userId: socket.user._id
            });
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
};

module.exports = { initializeChatSocket };
