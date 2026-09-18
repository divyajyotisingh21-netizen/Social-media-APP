const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    recipientEmail: {
        type: String,
        required: true
    },

    senderEmail: {
        type: String,
        required: true
    },

    senderName: {
        type: String,
        required: true
    },

    type: {
        type: String,
        enum: ["like", "comment", "follow"],
        required: true
    },

    message: {
        type: String,
        required: true
    },

    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        default: null
    },
read: {
    type: Boolean,
    default: false
},
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Notification", notificationSchema);