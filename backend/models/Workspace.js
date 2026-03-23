const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    // Members is an array (list) of User IDs
    members: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }]
}, { timestamps: true });

module.exports = mongoose.model('Workspace', workspaceSchema);