const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now },
    
    buyerUnreadCount: { type: Number, default: 0 },
    sellerUnreadCount: { type: Number, default: 0 },
    
    status: {
        type: String,
        enum: ["active", "closed", "blocked"],
        default: "active"
    }
}, { timestamps: true });

// Prevent duplicate conversations between the same buyer, seller, and property
conversationSchema.index({ propertyId: 1, buyerId: 1, sellerId: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', conversationSchema);
