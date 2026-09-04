const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authenticate = require('../middleware/auth');

// Create or get conversation
router.post('/conversations', authenticate, chatController.createOrGetConversation);

// Get my conversations
router.get('/conversations', authenticate, chatController.getMyConversations);

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', authenticate, chatController.getMessages);

// Mark messages as read
router.patch('/conversations/:conversationId/read', authenticate, chatController.markMessagesRead);

module.exports = router;
