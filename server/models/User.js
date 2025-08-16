import mongoose from "mongoose";
import Post from "./Post.js"; // your Post model
import Story from "./Story.js"; // your Story model (if any)

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    email: { type: String, required: true },
    full_name: { type: String, required: true },
    username: { type: String, required: true },
    bio: { type: String, default: "Hey there! I am using KnowledgeHive" },
    profile_picture: { type: String, default: "" },
    cover_photo: { type: String, default: "" },
    location: { type: String, default: "" },
    year: { type: String, default: "" },
    followers: [{ type: String, ref: "User", default: [] }],
    following: [{ type: String, ref: "User", default: [] }],
    connections: [{ type: String, ref: "User", default: [] }],
  },
  { timestamps: true, minimize: false }
);

// Pre-remove hook to delete posts and stories
userSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
  try {
    const userId = this._id;

    // Delete user's posts
    await Post.deleteMany({ user: userId });

    // Delete user's stories
    await Story.deleteMany({ user: userId });

    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model("User", userSchema);

export default User;
