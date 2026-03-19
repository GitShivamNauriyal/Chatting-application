const express = require('express');
const router = express.Router();
const Workspace = require('../models/Workspace');
const authMiddleware = require('../middleware/authMiddleware');

// --- 1. CREATE A WORKSPACE ---
// POST /api/workspaces
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name } = req.body;

        const newWorkspace = new Workspace({
            name: name,
            owner: req.user.userId, // Got this from the middleware!
            members: [req.user.userId] // The creator is automatically the first member
        });

        await newWorkspace.save();
        res.status(201).json(newWorkspace);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error creating workspace' });
    }
});

// --- 2. GET ALL WORKSPACES FOR LOGGED-IN USER ---
// GET /api/workspaces
router.get('/', authMiddleware, async (req, res) => {
    try {
        // Find all workspaces where this user's ID is inside the 'members' array
        const workspaces = await Workspace.find({ members: req.user.userId });
        res.json(workspaces);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching workspaces' });
    }
});

module.exports = router;