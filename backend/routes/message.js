const express = require("express")
const router = express.Router()
const Message = require("../models/Message")
const authMiddleware = require("../middleware/authMiddleware") // make sure this path is correct!

// --- GET ALL MESSAGES FOR A SPECIFIC CHANNEL ---
router.get("/:channelId", authMiddleware, async (req, res) => {
    try {
        const { channelId } = req.params

        // THE FIX: We changed { channelId: channelId } to { channel: channelId }
        // so it perfectly matches your database schema!
        const messages = await Message.find({ channel: channelId }).populate(
            "sender",
            "username email",
        )

        res.json(messages)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Server error fetching messages" })
    }
})

// --- CREATE A NEW MESSAGE ---
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { content, channelId } = req.body
        const senderId = req.user.userId || req.user._id // From your auth token

        const newMessage = await Message.create({
            content: content,
            sender: senderId,
            channel: channelId,
        })

        // Add the username to the message so React can display it
        await newMessage.populate("sender", "username email")

        res.status(201).json(newMessage)
    } catch (error) {
        console.error("Error saving message:", error)
        res.status(500).json({ message: "Server error saving message" })
    }
})

// --- DELETE A MESSAGE ---
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const deletedMessage = await Message.findByIdAndDelete(req.params.id)

        if (!deletedMessage) {
            return res.status(404).json({ message: "Message not found" })
        }
        res.status(200).json({ message: "Message deleted successfully" })
    } catch (error) {
        console.error("Delete Error:", error)
        res.status(500).json({ message: "Server error deleting message" })
    }
})

module.exports = router
