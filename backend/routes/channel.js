const express = require("express")
const router = express.Router()
const Channel = require("../models/Channel")
const authMiddleware = require("../middleware/authMiddleware")

// --- 1. CREATE A CHANNEL IN A WORKSPACE ---
// POST /api/channels/:workspaceId
router.post("/:workspaceId", authMiddleware, async (req, res) => {
    try {
        const { name } = req.body
        const { workspaceId } = req.params // Get the workspace ID from the URL

        const newChannel = new Channel({
            name: name,
            workspace: workspaceId,
        })

        await newChannel.save()
        res.status(201).json(newChannel)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Server error creating channel" })
    }
})

// --- 2. GET ALL CHANNELS FOR A WORKSPACE ---
// GET /api/channels/:workspaceId
router.get("/:workspaceId", authMiddleware, async (req, res) => {
    try {
        const { workspaceId } = req.params
        // Find all channels that belong to this specific workspace ID
        const channels = await Channel.find({ workspace: workspaceId })
        res.json(channels)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Server error fetching channels" })
    }
})

module.exports = router
