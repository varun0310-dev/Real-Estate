const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    messageType: {
        type: String,
        enum: ["text", "image", "file", "property"],
        default: "text"
    },
    
    text: { type: String, required: true },
    
    attachments: { type: Array, default: [] },
    
    isRead: {
        type: Boolean,
        default: false
    },
    
    readAt: { type: Date }
}, { timestamps: true });

// Index for efficient message retrieval
messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
