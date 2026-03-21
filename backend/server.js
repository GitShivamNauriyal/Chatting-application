const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables from .env file
dotenv.config();

const app = express();
const server = http.createServer(app);

// --- MIDDLEWARE ---
app.use(cors({
  origin: "*", // Allows your frontend to connect
  methods: ["GET", "POST", "PUT", "DELETE"]
}));
app.use(express.json());

// --- MONGODB CONNECTION ---
const mongoURI = process.env.MONGO_URI; 

mongoose.connect(mongoURI)
  .then(() => console.log('✅ Connected to MongoDB Atlas!'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// --- ROUTES ---
// Note: Ensure these paths match your actual route files!
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/workspaces', require('./routes/workspaceRoutes'));
app.use('/api/channels', require('./routes/channelRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));

// --- SOCKET.IO SETUP ---
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// The "Guestbook" to track who is currently online
const onlineUsers = new Map(); 

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // 1. Join a specific channel room
  socket.on('join_channel', (channelId) => {
    socket.join(channelId);
  });

  // 2. Handle sending messages instantly
  socket.on('send_message', (data) => {
    socket.to(data.channelId).emit('receive_message', data);
  });

  // 3. Handle "Typing..." indicators
  socket.on('typing', (data) => {
    socket.to(data.channelId).emit('user_typing', data.username);
  });

  socket.on('stop_typing', (channelId) => {
    socket.to(channelId).emit('user_stopped_typing');
  });

  // 4. Handle "Green Dot" online status
  socket.on('register_user', (userId) => {
    onlineUsers.set(socket.id, userId);
    // Broadcast the unique list of online user IDs to everyone
    io.emit('online_users', Array.from(new Set(onlineUsers.values())));
  });

  // 5. NEW: Handle deleting messages instantly
  socket.on('delete_message', (data) => {
    // Tell everyone else in the channel to remove this specific message ID
    socket.to(data.channelId).emit('message_deleted', data.messageId);
  });

  // 6. Handle user disconnecting (closing the tab/browser)
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    onlineUsers.delete(socket.id);
    // Update everyone's screen to remove the green dot for this user
    io.emit('online_users', Array.from(new Set(onlineUsers.values())));
  });
});

// --- START SERVER ---
const PORT = process.env.PORT || 10000; // Render prefers 10000, fallback to 5000
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});