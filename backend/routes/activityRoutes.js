const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');

const MAX_ITEMS = 20;

/**
 * Helper function to merge deduplicate and cap activity arrays
 */
const mergeActivity = (existing = [], incoming = [], keyField) => {
    // Start with incoming as they are the most recent
    const merged = [...incoming];

    // Add existing ones that don't match the keyField
    existing.forEach(item => {
        if (!merged.find(m => m[keyField] === item[keyField])) {
            merged.push(item);
        }
    });

    // Sort by timestamp descending
    merged.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Cap at MAX_ITEMS
    return merged.slice(0, MAX_ITEMS);
};

// @route   POST /api/activity/sync
// @desc    Sync local storage activity with DB on login
// @access  Private
router.post('/sync', authMiddleware, async (req, res) => {
    try {
        const { searches = [], views = [] } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.recentSearches = mergeActivity(user.recentSearches, searches, 'label');
        user.recentViews = mergeActivity(user.recentViews, views, 'propertyId');

        await user.save();

        res.json({
            recentSearches: user.recentSearches,
            recentViews: user.recentViews
        });
    } catch (err) {
        console.error('Error syncing activity:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/activity
// @desc    Add a single recent search or view
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { type, item } = req.body; // type: 'search' or 'view'
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (type === 'search') {
            user.recentSearches = mergeActivity(user.recentSearches, [item], 'label');
        } else if (type === 'view') {
            user.recentViews = mergeActivity(user.recentViews, [item], 'propertyId');
        } else {
            return res.status(400).json({ message: 'Invalid activity type' });
        }

        await user.save();

        res.json({
            recentSearches: user.recentSearches,
            recentViews: user.recentViews
        });
    } catch (err) {
        console.error('Error adding activity:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/activity/:type
// @desc    Clear recent searches or views
// @access  Private
router.delete('/:type', authMiddleware, async (req, res) => {
    try {
        const type = req.params.type; // 'search' or 'view'
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (type === 'search') {
            user.recentSearches = [];
        } else if (type === 'view') {
            user.recentViews = [];
        } else {
            return res.status(400).json({ message: 'Invalid activity type' });
        }

        await user.save();

        res.json({ message: 'Activity cleared' });
    } catch (err) {
        console.error('Error clearing activity:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
