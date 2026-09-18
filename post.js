const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({

    user: {
        type: String,
        default: "Bcrypt Test"
    },
ownerEmail: {
    type: String,
    default: ""
},
    content: {
        type: String,
        required: true
    },
ownerEmail: {
    type: String,
    default: ""
},
    likes: {
        type: Number,
        default: 0
    },
likedBy: {
    type: [String],
    default: []
},
    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("Post", postSchema);