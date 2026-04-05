const mongoose = require("mongoose")

const channelSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        // Every channel must belong to a specific Workspace
        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
        },
    },
    { timestamps: true },
)

module.exports = mongoose.model("Channel", channelSchema)
