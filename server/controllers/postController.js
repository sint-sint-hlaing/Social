import fs from "fs";
import imagekit from "../config/imagekit.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";

// Add Post
export const addPost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { content, post_type } = req.body;
    const images = req.files;

      // Limit to 4 images
    if (images.length > 4) {
      return res.status(400).json({
        success: false,
        message: "You can upload a maximum of 4 images per post",
      });
    }

    let image_urls = [];

    if (images.length) {
      image_urls = await Promise.all(
  images.map(async (image) => {
    // Use buffer directly if available, fallback to path
    const fileBuffer = image.buffer || fs.readFileSync(image.path);

    const response = await imagekit.upload({
      file: fileBuffer,
      fileName: image.originalname,
      folder: "posts",
    });

    const url = imagekit.url({
      path: response.filePath,
      transformation: [
        { quality: "auto" },
        { format: "webp" },
        { width: "512" },
      ],
    });

    return url;
  })
);

    }
    await Post.create({
      user: userId,
      content,
      image_urls,
      post_type,
    });
    res.json({ success: true, message: "Post Created Successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
//Get Posts;
export const getFeedPosts = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findById(userId);

    const connections = Array.isArray(user.connections) ? user.connections : [];
    const following = Array.isArray(user.following) ? user.following : [];
    const userIds = [userId, ...connections, ...following];

    const { search } = req.query;

    let query = {};

    if (search) {
      // Search from ALL posts, not just connections/following
      query.content = { $regex: search, $options: "i" };
    } else {
      // Default feed: only from connections/following/self
      query.user = { $in: userIds };
    }

    let posts;

if (search) {
  posts = await Post.find({ content: { $regex: search, $options: "i" } })
    .populate("user")
    .sort({ createdAt: -1 }); // latest for search
} else {
  // Random posts for feed
  posts = await Post.aggregate([
    { $match: { user: { $in: userIds } } },
    { $sample: { size: 50 } }, // get 50 random posts
  ]);

  // Populate user for aggregate results
  posts = await User.populate(posts, { path: "user" });
}

    res.json({ success: true, posts });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Delete Post
export const deletePost = async (req, res) => {
  try {
    const { userId } = req.auth(); // Current logged-in user
    const { id } = req.params; // Post ID from URL

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    // Only the post owner can delete
    if (post.user.toString() !== userId) {
      return res.status(403).json({ success: false, message: "You can't delete this post" });
    }

    // Delete all comments associated with this post
    await Comment.deleteMany({ post: post._id });

    // Delete the post itself
    await Post.findByIdAndDelete(id);

    res.json({ success: true, message: "Post and its comments deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// Like Post
export const likePost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { postId } = req.body;

    const post = await Post.findById(postId);
    if (post.likes_count.includes(userId)) {
      post.likes_count = post.likes_count.filter((user) => user !== userId);
      await post.save();
      res.json({ success: true, message: "Post unliked" });
    } else {
      post.likes_count.push(userId);
      await post.save();
      res.json({ success: true, message: "Post liked" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
