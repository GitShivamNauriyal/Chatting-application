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

// --- DELETE A MESSAGE ---
// DELETE /api/messages/:id
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        // This finds the ID and deletes it in one single, safe step
        const deletedMessage = await Message.findByIdAndDelete(req.params.id);
        
        if (!deletedMessage) {
            return res.status(404).json({ message: 'Message not found' });
        }

        res.status(200).json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ message: 'Server error deleting message' });
    }
});

module.exports = router;