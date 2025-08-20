import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    from_user_id: { type: String, ref: "User", required: true },
    to_user_id:   { type: String, ref: "User", required: true },

    text: { type: String, trim: true },

    // add "file"
    message_type: { type: String, enum: ["text", "image", "file"], default: "text" },

    media_url: { type: String },      // image or file URL
    file_name: { type: String },       // for files
    mime_type: { type: String },       // for files

    seen: { type: Boolean, default: false },
  },
  { timestamps: true, minimize: false }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
