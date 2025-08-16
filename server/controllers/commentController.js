import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import User from "../models/User.js";

export const addComment = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { post: postId, text } = req.body;

    // Fetch the user data
    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // Create the comment with full user object
    const comment = await Comment.create({
      post: postId,
      user: {
        _id: user._id,
        full_name: user.full_name,
        username: user.username,
        profile_picture: user.profile_picture,
      },
      text,
    });

    // Add comment to Post's comments array
    await Post.findByIdAndUpdate(postId, {
      $push: { comments: comment._id },
    });

    res.json(comment);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getComments = async (req, res) => {
  const { postId } = req.params;

  try {
    const comments = await Comment.find({ post: postId }).sort({
      createdAt: -1,
    });
    
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { userId } = req.auth(); // from Clerk or JWT
    const { commentId } = req.params;

    // Find the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    // Only the owner of the comment (or admin if you implement roles) can delete
    if (comment.user._id.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this comment" });
    }

    // Remove comment reference from Post
    await Post.findByIdAndUpdate(comment.post, {
      $pull: { comments: comment._id },
    });

    // Delete the comment
    await comment.deleteOne();

    res.json({ success: true, message: "Comment deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
