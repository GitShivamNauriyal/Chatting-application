const mongoose = require('mongoose');

// Define what information a User will have
const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true // No two users can have the same username
    },
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    }
}, { timestamps: true }); // Automatically adds createdAt and updatedAt dates

// Export the model so we can use it in other files
module.exports = mongoose.model('User', userSchema);