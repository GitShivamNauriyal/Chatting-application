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

// --- 3. JOIN AN EXISTING WORKSPACE ---
// POST /api/workspaces/join
router.post('/join', authMiddleware, async (req, res) => {
    try {
        const { workspaceId } = req.body;

        // 1. Find the workspace the user wants to join
        const workspace = await Workspace.findById(workspaceId);
        
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found. Check the ID.' });
        }

        // 2. Check if the user is ALREADY inside the members array
        if (workspace.members.includes(req.user.userId)) {
            return res.status(400).json({ message: 'You are already a member of this workspace!' });
        }

        // 3. Add the user to the workspace
        workspace.members.push(req.user.userId);
        await workspace.save();

        res.status(200).json(workspace);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error joining workspace' });
    }
});

module.exports = router;