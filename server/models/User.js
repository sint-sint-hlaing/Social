import mongoose from "mongoose";
import Post from "./Post.js";
import Story from "./Story.js";

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

// Hook for query-based deletes (findOneAndDelete / findByIdAndDelete)
userSchema.pre("findOneAndDelete", async function (next) {
  try {
    const doc = await this.model.findOne(this.getFilter());
    if (doc) {
      const userId = doc._id;
      await Post.deleteMany({ user: userId });
      await Story.deleteMany({ user: userId });
    }
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model("User", userSchema);

export default User;
