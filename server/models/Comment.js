import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
     user: {
      _id: { type: String, required: true },       // Clerk user ID
      full_name: { type: String, required: true },
      username: { type: String },
      profile_picture: { type: String },
    },
    text: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Comment", commentSchema);
