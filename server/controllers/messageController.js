

// Controller function for the SSE endpoint
import fs from "fs";
import imagekit from "../config/imagekit.js";
import Message from "../models/Message.js";
import { constants } from "vm";

// Create an empty object to store SSE connections: { userId: res }
const connections = {};

/** Utility: notify a connected user (if connected) with an SSE event */
const notifyUser = (userId, eventName, payload) => {
  try {
    if (!connections[userId]) return;
    // SSE event with name `eventName`
    connections[userId].write(`event: ${eventName}\n`);
    connections[userId].write(`data: ${JSON.stringify(payload)}\n\n`);
  } catch (err) {
    console.warn("notifyUser error:", err);
  }
};

// SSE endpoint: client connects to receive realtime events
export const sseController = (req, res) => {
  // You pass userId as param (existing behavior). If you prefer to use auth, tweak accordingly.
  const { userId } = req.params;
  console.log("SSE client connected:", userId);

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // keepAlive heartbeat (optional)
  const keepAlive = setInterval(() => res.write(": keep-alive\n\n"), 25 * 1000);

  // store
  connections[userId] = res;

  // initial ping
  res.write("event: connected\n");
  res.write(`data: ${JSON.stringify({ message: "connected" })}\n\n`);

  // When a user connects, mark any undelivered messages TO that user as delivered,
  // and notify the original senders that those messages are delivered.
  (async () => {
    try {
      const pending = await Message.find({ to_user_id: userId, delivered: false });
      if (pending.length) {
        const groupedBySender = pending.reduce((acc, m) => {
          acc[m.from_user_id] = acc[m.from_user_id] || [];
          acc[m.from_user_id].push(m._id.toString());
          return acc;
        }, {});

        // mark them delivered
        await Message.updateMany({ to_user_id: userId, delivered: false }, { delivered: true });

        // notify each sender (if connected) that their messages were delivered
        for (const senderId of Object.keys(groupedBySender)) {
          const messageIds = groupedBySender[senderId];
          notifyUser(senderId, "delivered", { messageIds, to_user_id: userId });
        }
      }
    } catch (err) {
      console.error("Error processing pending delivered messages on SSE connect:", err);
    }
  })();

  req.on("close", () => {
    clearInterval(keepAlive);
    delete connections[userId];
    console.log("SSE client disconnected:", userId);
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

    if (image) {
      message_type = "image";
      const resp = await imagekit.upload({
        file: image.buffer,
        fileName: image.originalname,
      });
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
      media_url = resp.url;
      file_name = file.originalname;
      mime_type = file.mimetype;
    }

    // If recipient is connected via SSE, mark delivered immediately
    const isRecipientConnected = Boolean(connections[to_user_id]);

    const message = await Message.create({
      from_user_id: userId,
      to_user_id,
      text,
      message_type,
      media_url,
      file_name: file_name || undefined,
      mime_type: mime_type || undefined,
      delivered: isRecipientConnected, // set delivered true if recipient is connected now
    });

    // Populate before returning
    const messageWithUserData = await Message.findById(message._id).populate("from_user_id");

    // send to recipient over SSE if connected
    if (isRecipientConnected) {
      // push message
      connections[to_user_id].write(`event: message\n`);
      connections[to_user_id].write(`data: ${JSON.stringify(messageWithUserData)}\n\n`);

      // notify sender (if they are connected) that their message is delivered
      // (the sender may already get `delivered: true` via DB, but notify to update UI)
      if (connections[userId]) {
        notifyUser(userId, "delivered", { messageIds: [message._id.toString()], to_user_id });
      }
    }

    // respond to POST caller immediately with created message
    res.json({ success: true, message: messageWithUserData });
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

    // fetch messages in ascending order (oldest first)
    const messages = await Message.find({
      $or: [
        { from_user_id: userId, to_user_id },
        { from_user_id: to_user_id, to_user_id: userId },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();

    // mark message as seen (messages sent by the other user to current user)
    const toMark = await Message.updateMany(
      { from_user_id: to_user_id, to_user_id: userId, seen: false },
      { seen: true }
    );

    // If any were marked seen, inform their senders (the other user)
    if (toMark.nModified && toMark.nModified > 0) {
      // Find message ids that were changed
      const seenMessages = await Message.find({
        from_user_id: to_user_id,
        to_user_id: userId,
        seen: true,
      }).select("_id");

      const messageIds = seenMessages.map((m) => m._id.toString());
      // notify the original sender (to_user_id of these messages' senders)
      notifyUser(to_user_id, "seen", { messageIds, by: userId });
    }

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
