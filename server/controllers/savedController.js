import User from "../models/User.js";
import Post from "../models/Post.js";

// Toggle Save / Unsave
export const toggleSavePost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { postId } = req.params;

    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const isSaved = user.saved_posts.includes(postId);

    if (isSaved) {
      user.saved_posts = user.saved_posts.filter(
        (id) => id.toString() !== postId
      );
      await user.save();
      return res.json({ success: true, message: "Post unsaved", saved: false });
    } else {
      user.saved_posts.push(postId);
      await user.save();
      return res.json({ success: true, message: "Post saved", saved: true });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Saved Posts
export const getSavedPosts = async (req, res) => {
  try {
    const { userId } = req.auth();

    const user = await User.findById(userId).populate({
      path: "saved_posts",
      populate: { path: "user" },
    });

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // Reverse to show latest saved first
    const posts = [...user.saved_posts].reverse();

    res.json({ success: true, posts });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
