const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import our User model

const router = express.Router();

// --- 1. REGISTER A NEW USER ---
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        let existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Scramble (hash) the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create the new user in the database
        const newUser = new User({
            username,
            email,
            password: hashedPassword // Save the scrambled password, not the real one!
        });

        await newUser.save();
        res.status(201).json({ message: "User registered successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error during registration" });
    }
});

// --- 2. LOGIN AN EXISTING USER ---
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Compare the typed password with the scrambled password in the DB
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Create the JWT (The "VIP Wristband")
        const token = jwt.sign(
            { userId: user._id }, // Data we want to attach to the token
            process.env.JWT_SECRET, // The secret key from .env
            { expiresIn: '7d' } // Token expires in 7 days
        );

        res.json({
            message: "Login successful",
            token: token,
            user: { id: user._id, username: user.username, email: user.email }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error during login" });
    }
});

module.exports = router;