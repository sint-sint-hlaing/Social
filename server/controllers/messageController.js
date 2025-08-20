import fs from "fs";
import imagekit from "../config/imagekit.js";
import Message from "../models/Message.js";
import { constants } from "vm";

// Create an empty object to store SS Event connections
const connections = {};

// Controller function for the SSE endpoint
export const sseController = (req, res) => {
  const { userId } = req.params;
  console.log("New client connected :", userId);

  // Set SSE header
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Add the client's response object to the connections object
  connections[userId] = res;

  // Send an initial event to the client
  res.write("log: Connection to SSE stream\n\n");

  // Handle client disconnection
  req.on("close", () => {
    // Remove the client's response object from the connection array
    delete connections[userId];
    console.log("Client disconnected");
  });
};

// Send Message
export const sendMessage = async (req, res) => {
  try {
    const { userId } = req.auth();               // Clerk
    const { to_user_id, text } = req.body;

    const image = req.files?.image?.[0] || null;  // from multer memory
    const file  = req.files?.file?.[0]  || null;

    let message_type = "text";
    let media_url = "";
    let file_name = "";
    let mime_type = "";

    // If both were sent, prioritize image. Change if you prefer file-first.
    if (image) {
      message_type = "image";
      const resp = await imagekit.upload({
        file: image.buffer,              // Buffer (memoryStorage)
        fileName: image.originalname,
      });
      // Use transform ONLY for images
      media_url = imagekit.url({
        path: resp.filePath,
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { width: "1280" },
        ],
      });
    } else if (file) {
      message_type = "file";
      const resp = await imagekit.upload({
        file: file.buffer,
        fileName: file.originalname,
      });
      // For non-images, just use the original URL (no transform)
      media_url = resp.url;
      file_name = file.originalname;
      mime_type = file.mimetype;
    }

    // text-only is allowed (message_type remains "text")
    const message = await Message.create({
      from_user_id: userId,
      to_user_id,
      text,
      message_type,
      media_url,
      file_name: file_name || undefined,
      mime_type: mime_type || undefined,
    });

    res.json({ success: true, message });

    // Send to recipient over SSE
    // (Populate works because your User._id is a string matching from_user_id)
    const messageWithUserData = await Message.findById(message._id).populate(
      "from_user_id"
    );

    if (connections[to_user_id]) {
      connections[to_user_id].write(
        `data: ${JSON.stringify(messageWithUserData)}\n\n`
      );
    }
  } catch (error) {
    console.error("sendMessage error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// Get Chat Message
export const getChatMessages = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to_user_id } = req.body;

    const messages = await Message.find({
      $or: [
        { from_user_id: userId, to_user_id },
        { from_user_id: to_user_id, to_user_id: userId },
      ],
    }).sort({ createdAt: -1 });
    // mark message as seen
    await Message.updateMany(
      { from_user_id: to_user_id, to_user_id: userId },
      { seen: true }
    );
    res.json({ success: true, messages });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const getUserRecentMessages = async (req, res) => {
  try {
    const { userId } = req.auth();
    const messages = await Message.find({ to_user_id: userId })
      .populate("from_user_id to_user_id")
      .sort({ createdAt: -1 });

    res.json({ success: true, messages });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
