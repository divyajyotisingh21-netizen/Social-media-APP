
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const User = require("./Users");
const Post = require("./Post");
const Comment = require("./Comment");
const Notification = require("./models/Notification");
const app = express();

app.use(express.json());
app.use(express.static("public"));

// =========================
// HOME
// =========================

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});
app.get("/search/users", async (req, res) => {
    try {

        const query = req.query.q || "";

        const users = await User.find({
            $or: [
                { name: { $regex: query, $options: "i" } },
                { email: { $regex: query, $options: "i" } }
            ]
        }).select("name email bio profileImage");

        res.json(users);

    } catch (error) {

        console.log("Search users error:", error);

        res.status(500).json({
            message: "Error searching users"
        });
    }
});

    app.get("/notifications/:email", async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipientEmail: req.params.email
        }).sort({
            createdAt: -1
        });

        res.json(notifications);

    } catch (error) {
        console.log("Notification error:", error);

        res.status(500).json({
            message: "Error loading notifications"
        });
    }
});
app.put("/notifications/read/:email", async (req, res) => {
    try {
        await Notification.updateMany(
            {
                recipientEmail: req.params.email,
                read: false
            },
            {
                $set: { read: true }
            }
        );

        res.json({
            message: "Notifications marked as read"
        });

    } catch (error) {
        console.log("Mark notifications read error:", error);

        res.status(500).json({
            message: "Error updating notifications"
        });
    }
});
// =========================
// GET ALL USERS
// =========================

app.get("/users", async (req, res) => {
    try {
        const users = await User.find();

        res.json(users);

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Error fetching users",
            error: error.message
        });
    }
});

app.get("/profile/:email", async (req, res) => {
    try {

        const user = await User.findOne({
            email: req.params.email
        }).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json(user);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Error fetching profile"
        });

    }
});


    
        app.post("/follow", async (req, res) => {
    try {

        const { followerEmail, followingEmail } = req.body;

        const follower = await User.findOne({
            email: followerEmail
        });

        const following = await User.findOne({
            email: followingEmail
        });

        if (!follower || !following) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (followerEmail === followingEmail) {
            return res.status(400).json({
                message: "You cannot follow yourself"
            });
        }

        const isFollowing =
            follower.following.includes(followingEmail);

        // UNFOLLOW
        if (isFollowing) {

            follower.following =
                follower.following.filter(
                    email => email !== followingEmail
                );

            following.followers =
                following.followers.filter(
                    email => email !== followerEmail
                );

            await follower.save();
            await following.save();
const notification = new Notification({
    recipientEmail: followingEmail,
    senderEmail: followerEmail,
    senderName: follower.name,
    type: "follow",
    message: "started following you 👤"
});

await notification.save();
            return res.json({
                message: "Unfollowed successfully",
                following: false
            });
        }

        // FOLLOW
        follower.following.push(followingEmail);

        following.followers.push(followerEmail);

        await follower.save();
        await following.save();
const notification = new Notification({
    recipientEmail: followingEmail,
    senderEmail: followerEmail,
    senderName: follower.name,
    type: "follow",
    message: "started following you 👤"
});

await notification.save();
        res.json({
            message: "Followed successfully",
            following: true
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Error updating follow status"
        });
    }
});
// =========================
// CREATE USER
// =========================

app.post("/users", async (req, res) => {
    try {
        const user = new User(req.body);

        await user.save();

        res.status(201).json({
            message: "User created successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Error creating user",
            error: error.message
        });
    }
});

app.put("/profile/:email", async (req, res) => {
    try {
        const { name, bio } = req.body;

        const user = await User.findOneAndUpdate(
            { email: req.params.email },
            {
                name: name,
                bio: bio
            },
            { new: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json({
            message: "Profile updated successfully",
            user: user
        });

    } catch (error) {
        console.log("Profile update error:", error);

        res.status(500).json({
            message: "Error updating profile"
        });
    }
});
// =========================
// LOGIN
// =========================

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({
            email: email
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Invalid password"
            });
        }

        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        res.json({
            message: "Login successful",
            token: token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Login error",
            error: error.message
        });
    }
});


// =========================
// CREATE POST
// =========================

app.post("/posts", async (req, res) => {
    
    try {

       const newPost = new Post({
    user: user,
    content: content,
    ownerEmail: req.body.ownerEmail || ""
});

        await post.save();
const sender = await User.findOne({
    email: email
});

if (
    sender &&
    post.ownerEmail &&
    post.ownerEmail !== email
) {
    await Notification.create({
        recipientEmail: post.ownerEmail,
        senderEmail: email,
        senderName: sender.name,
        type: "like",
        message: "liked your post ❤️",
        postId: post._id
    });
}
        res.status(201).json({
            message: "Post created successfully",
            post: post
        });

    } catch (error) {

        console.log(error);

       res.status(500).json({
    message: error.message
});
    }
});
// =========================
// GET ALL POSTS
// =========================

app.get("/posts", async (req, res) => {
    
    try {
        const posts = await Post.find().sort({
            createdAt: -1
        });

        res.json(posts);

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Error fetching posts",
            error: error.message
        });
    }
});


// =========================
// LIKE POST
// =========================

app.put("/posts/:id/like", async (req, res) => {
    try {

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "User email is required"
            });
        }

        const post = await Post.findById(req.params.id);
const currentUser = await User.findOne({
    email: email
});

if (!currentUser) {
    return res.status(404).json({
        message: "User not found"
    });
}
        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        // Check whether user already liked the post
        const alreadyLiked =
            post.likedBy.includes(email);

        if (alreadyLiked) {

            // UNLIKE
            post.likedBy =
                post.likedBy.filter(
                    userEmail => userEmail !== email
                );

            post.likes = post.likedBy.length;

            await post.save();


            return res.json({
                message: "Post unliked",
                liked: false,
                likes: post.likes
            });
        }

        // LIKE
        post.likedBy.push(email);

        post.likes = post.likedBy.length;

        await post.save();
if (post.ownerEmail && post.ownerEmail !== email) {
    await Notification.create({
        recipientEmail: post.ownerEmail,
        senderEmail: email,
        senderName: currentUser.name,
        type: "like",
        message: "liked your post ❤️",
        postId: post._id
    });
}
        res.json({
            message: "Post liked",
            liked: true,
            likes: post.likes
        });

    } catch (error) {

        console.log("LIKE ERROR:", error);

        res.status(500).json({
            message: "Error updating like"
        });
    }
});

// =========================
// DELETE POST
// =========================

app.delete("/posts/:id", async (req, res) => {
    try {
        const post = await Post.findByIdAndDelete(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        res.json({
            message: "Post deleted successfully",
            post: post
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Error deleting post",
            error: error.message
        });
    }
});


// =========================
// CREATE COMMENT
// =========================

app.post("/comments", async (req, res) => {
    try {
        const {
            postId,
            user,
            userEmail,
            content
        } = req.body;

        if (!postId || !user || !userEmail || !content) {
            return res.status(400).json({
                message: "Post ID, user, email and content are required"
            });
        }

        const comment = new Comment({
            postId: postId,
            user: user,
            userEmail: userEmail,
            content: content
        });

        await comment.save();

        // Find the post owner
        const post = await Post.findById(postId);

        // Create notification for post owner
        if (
            post &&
            post.ownerEmail &&
            post.ownerEmail !== userEmail
        ) {
            await Notification.create({
                recipientEmail: post.ownerEmail,
                senderEmail: userEmail,
                senderName: user,
                type: "comment",
                message: "commented on your post 💬",
                postId: post._id
            });
        }

        res.status(201).json({
            message: "Comment created successfully",
            comment: comment
        });

    } catch (error) {
        console.log("Comment error:", error);

        res.status(500).json({
            message: "Error creating comment",
            error: error.message
        });
    }
});

// =========================
// GET COMMENTS OF A POST
// =========================

app.get("/posts/:id/comments", async (req, res) => {
    try {
        const comments = await Comment.find({
            postId: req.params.id
        }).sort({
            createdAt: -1
        });

        res.json(comments);

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Error fetching comments",
            error: error.message
        });
    }
});
app.delete("/comments/:id", async (req, res) => {
    try {
        const { userEmail } = req.body;

        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({
                message: "Comment not found"
            });
        }

        if (comment.userEmail !== userEmail) {
            return res.status(403).json({
                message: "You can delete only your own comment"
            });
        }

        await Comment.findByIdAndDelete(req.params.id);

        res.json({
            message: "Comment deleted successfully"
        });

    } catch (error) {
        console.log("Delete comment error:", error);

        res.status(500).json({
            message: "Error deleting comment"
        });
    }
});

// =========================
// MONGODB CONNECTION
// =========================

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((error) => {
        console.log(
            "MongoDB connection failed:",
            error.message
        );
    });


// =========================
// START SERVER
// =========================

app.listen(5000, () => {
    console.log("Server is running on port 5000");
});