const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const authMiddleware = require('../middleware/authMiddleware');

// --- GET ALL MESSAGES FOR A SPECIFIC CHANNEL ---
// GET /api/messages/:channelId
router.get('/:channelId', authMiddleware, async (req, res) => {
    try {
        const { channelId } = req.params;
        
        // Find messages for this channel and populate the sender's username
        // .populate() replaces the sender's ID with their actual username so we can display it!
        const messages = await Message.find({ channel: channelId })
                                      .populate('sender', 'username email');
        
        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching messages' });
    }
});

module.exports = router;