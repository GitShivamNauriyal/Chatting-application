const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    // The owner is linked to a specific User ID
    owner: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    // Members is an array (list) of User IDs
    members: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }]
}, { timestamps: true });

module.exports = mongoose.model('Workspace', workspaceSchema);