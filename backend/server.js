const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// --- SOCKET.IO IMPORTS ---
const http = require('http');
const { Server } = require('socket.io');
const Message = require('./models/Message'); // We need the model to save live messages

const app = express();

// --- SOCKET.IO SETUP ---
// We create an HTTP server and pass our Express app into it
const server = http.createServer(app); 

// Initialize Socket.IO with CORS (allowing our future React frontend to connect)
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Default React port
        methods: ["GET", "POST"]
    }
});

app.use(cors()); 
app.use(express.json()); 
// This looks for the MONGO_URI variable on Render
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/workspace-chat-fresh';

mongoose.connect(mongoURI)
  .then(() => console.log('✅ Connected to MongoDB Atlas!'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// --- API Routes ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/workspaces', require('./routes/workspace'));
app.use('/api/channels', require('./routes/channel'));
app.use('/api/messages', require('./routes/message')); // ADDED MESSAGE ROUTE

app.get('/', (req, res) => {
    res.send('Workspace Chat API is running with WebSockets!');
});

// --- REAL-TIME SOCKET.IO LOGIC ---
io.on('connection', (socket) => {
    console.log(`User connected to WebSockets: ${socket.id}`);

    // 1. When a user clicks on a channel, they "join" a Socket room for that channel
    socket.on('join_channel', (channelId) => {
        socket.join(channelId);
        console.log(`User joined channel: ${channelId}`);
    });

    // 2. When a user sends a message
    socket.on('send_message', async (data) => {
        try {
            // data will contain: { content, senderId, channelId }
            
            // Save message to MongoDB first
            const newMessage = new Message({
                content: data.content,
                sender: data.senderId,
                channel: data.channelId
            });
            await newMessage.save();

            // Populate the sender data so the frontend can show the username instantly
            await newMessage.populate('sender', 'username');

            // Broadcast the saved message ONLY to users in that specific channel
            io.to(data.channelId).emit('receive_message', newMessage);
            
        } catch (error) {
            console.error("Error saving message via socket:", error);
        }
    });

    // 3. When a user disconnects (closes the tab)
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5000;

// IMPORTANT: We must use server.listen() now, NOT app.listen()
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});