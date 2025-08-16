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
      createdAt: 1,
    });
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
};
