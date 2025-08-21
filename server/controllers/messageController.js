

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
    const key = String(userId);
    const res = connections[key];
    if (!res) {
      console.log(`notifyUser: no active SSE connection for ${key}`);
      return;
    }
    res.write(`event: ${eventName}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
    console.log(`notifyUser: sent event '${eventName}' to ${key}`, payload);
  } catch (err) {
    console.error("notifyUser error:", err);
  }
};

// SSE controller
export const sseController = (req, res) => {
  const { userId } = req.params;
  const key = String(userId);

  console.log("SSE client connected :", key);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // heartbeat (optional)
  const keepAlive = setInterval(() => res.write(": keep-alive\n\n"), 25 * 1000);

  connections[key] = res;

  res.write("event: connected\n");
  res.write(`data: ${JSON.stringify({ message: "connected", userId: key })}\n\n`);

  // When user connects, mark any undelivered messages TO them as delivered
  (async () => {
    try {
      const pending = await Message.find({ to_user_id: key, delivered: false }).lean();
      if (pending && pending.length) {
        const ids = pending.map((m) => String(m._id));
        // mark delivered
        await Message.updateMany({ to_user_id: key, delivered: false }, { delivered: true });

        // For each distinct sender, notify them that their messages were delivered
        const bySender = pending.reduce((acc, m) => {
          const from = String(m.from_user_id);
          acc[from] = acc[from] || [];
          acc[from].push(String(m._id));
          return acc;
        }, {});

        for (const senderId of Object.keys(bySender)) {
          notifyUser(senderId, "delivered", { messageIds: bySender[senderId], to_user_id: key });
        }
      }
    } catch (err) {
      console.error("Error marking pending delivered on connect:", err);
    }
  })();

  req.on("close", () => {
    clearInterval(keepAlive);
    delete connections[key];
    console.log("SSE client disconnected:", key);
  });
};


// Send Message
export const sendMessage = async (req, res) => {
  try {
    const { userId } = req.auth();               // Clerk
    const { to_user_id, text } = req.body;

    const image = req.files?.image?.[0] || null;
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
        transformation: [{ quality: "auto" }, { format: "webp" }, { width: "1280" }],
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

    const recipientKey = String(to_user_id);
    const isRecipientConnected = Boolean(connections[recipientKey]);

    const message = await Message.create({
      from_user_id: userId,
      to_user_id,
      text,
      message_type,
      media_url,
      file_name: file_name || undefined,
      mime_type: mime_type || undefined,
      delivered: isRecipientConnected,
    });

    // populate minimal sender info if you want
    const messageWithUserData = await Message.findById(message._id).populate("from_user_id").lean();

    // If recipient is connected, push message event and notify delivered
    if (isRecipientConnected) {
      notifyUser(recipientKey, "message", messageWithUserData);

      // also notify sender (if connected) that message is delivered
      const senderKey = String(userId);
      notifyUser(senderKey, "delivered", { messageIds: [String(message._id)], to_user_id: recipientKey });
    }

    res.json({ success: true, message: messageWithUserData });
  } catch (error) {
    console.error("sendMessage error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// Get Chat Messages -> also mark seen and notify sender(s)
export const getChatMessages = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to_user_id } = req.body;

    // fetch messages ascending
    const messages = await Message.find({
      $or: [
        { from_user_id: userId, to_user_id },
        { from_user_id: to_user_id, to_user_id: userId },
      ],
    }).sort({ createdAt: 1 }).lean();

    // mark messages sent by the other user as seen
    const result = await Message.updateMany(
      { from_user_id: to_user_id, to_user_id: userId, seen: false },
      { seen: true }
    );

    // if any were marked seen, notify the original sender (to_user_id)
    // Note: result.modifiedCount for modern mongoose, result.nModified older
    const modified = result.modifiedCount ?? result.nModified ?? 0;
    if (modified > 0) {
      // fetch the ids of messages now seen
      const seenMessages = await Message.find({
        from_user_id: to_user_id,
        to_user_id: userId,
        seen: true,
      }).select("_id").lean();

      // notify original sender with the updated message objects
    notifyUser(String(to_user_id), "seen", { messages: seenMessages, by: String(userId) });

      const messageIds = seenMessages.map((m) => String(m._id));
      // notify the original sender (the other party)
      notifyUser(String(to_user_id), "seen", { messageIds, by: String(userId) });
    }

    res.json({ success: true, messages });
  } catch (error) {
    console.log("getChatMessages error:", error);
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
