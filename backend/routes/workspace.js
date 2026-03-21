const express = require('express');
const router = express.Router();
const Workspace = require('../models/Workspace'); // Make sure this path matches your models folder
const authMiddleware = require('../middleware/authMiddleware');

// --- GET ALL WORKSPACES ---
// --- GET ALL WORKSPACES ---
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId || req.user._id; 
        
        // --- THE FIX IS HERE: Add .populate() ---
        const workspaces = await Workspace.find({ members: userId })
                                        .populate('members', 'username');
        
        res.json(workspaces);
    } catch (error) {
        console.error("Error fetching workspaces:", error);
        res.status(500).json({ message: 'Server error fetching workspaces' });
    }
});

// --- CREATE A NEW WORKSPACE ---
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.user.userId || req.user._id;

        const newWorkspace = new Workspace({
            name,
            members: [userId] // Add the creator as the first member
        });

        await newWorkspace.save();
        res.status(201).json(newWorkspace);
    } catch (error) {
        console.error("Error creating workspace:", error);
        res.status(500).json({ message: 'Server error creating workspace' });
    }
});

// --- JOIN A WORKSPACE ---
router.post('/join', authMiddleware, async (req, res) => {
    try {
        const { workspaceId } = req.body;
        const userId = req.user.userId || req.user._id;

        const workspace = await Workspace.findById(workspaceId);

        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found. Check the ID.' });
        }

        // Check if user is already a member
        if (workspace.members.includes(userId)) {
            return res.status(400).json({ message: 'You are already a member of this workspace.' });
        }

        // Add user to the workspace members array
        workspace.members.push(userId);
        await workspace.save();

        res.status(200).json(workspace);
    } catch (error) {
        console.error("Error joining workspace:", error);
        res.status(500).json({ message: 'Server error joining workspace' });
    }
});

module.exports = router;