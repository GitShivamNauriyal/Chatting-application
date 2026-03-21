const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const authMiddleware = require('../middleware/authMiddleware'); // make sure this path is correct!

// --- GET ALL MESSAGES FOR A SPECIFIC CHANNEL ---
router.get('/:channelId', authMiddleware, async (req, res) => {
    try {
        const { channelId } = req.params;
        const messages = await Message.find({ channelId: channelId })
                                      .populate('sender', 'username email');
        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching messages' });
    }
});

// --- DELETE A MESSAGE ---
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
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