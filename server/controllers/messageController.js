

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

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  const keepAlive = setInterval(() => res.write(": keep-alive\n\n"), 25000);

  connections[key] = res;

  (async () => {
    const pending = await Message.find({ to_user_id: key, delivered: false }).lean();
    if (pending.length) {
      const ids = pending.map(m => String(m._id));
      await Message.updateMany({ to_user_id: key, delivered: false }, { delivered: true });
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
  })();

  req.on("close", () => {
    clearInterval(keepAlive);
    delete connections[key];
  });
};



// Send Message
export const sendMessage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to_user_id, text } = req.body;

    // handle image/file
    let message_type = "text";
    let media_url = "";
    let file_name = "";
    let mime_type = "";

    if (req.files?.image?.[0]) {
      message_type = "image";
      const resp = await imagekit.upload({ file: req.files.image[0].buffer, fileName: req.files.image[0].originalname });
      media_url = imagekit.url({ path: resp.filePath });
    } else if (req.files?.file?.[0]) {
      message_type = "file";
      const resp = await imagekit.upload({ file: req.files.file[0].buffer, fileName: req.files.file[0].originalname });
      media_url = resp.url;
      file_name = req.files.file[0].originalname;
      mime_type = req.files.file[0].mimetype;
    }

    const recipientKey = String(to_user_id);
    const isRecipientConnected = Boolean(connections[recipientKey]);

    const message = await Message.create({
      from_user_id: userId,
      to_user_id,
      text,
      message_type,
      media_url,
      file_name,
      mime_type,
      delivered: isRecipientConnected,
    });

    const messageWithUser = await Message.findById(message._id).populate("from_user_id").lean();

    if (isRecipientConnected) {
      // send message to recipient
      notifyUser(recipientKey, "message", messageWithUser);
      // mark delivered for sender
      notifyUser(String(userId), "delivered", { messageIds: [String(message._id)], to_user_id: recipientKey });
    }

    res.json({ success: true, message: messageWithUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
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


// controllers/messageController.js
// Mark messages seen controller
export const markMessagesSeenController = async (req, res) => {
  try {
    const { messageIds } = req.body;
    if (!Array.isArray(messageIds) || !messageIds.length) {
      return res.status(400).json({ success: false, message: "No messageIds provided" });
    }

    const updated = await Message.updateMany(
      { _id: { $in: messageIds } },
      { $set: { seen: true } }
    );

    // Notify senders
    const messages = await Message.find({ _id: { $in: messageIds } }).lean();
    const bySender = messages.reduce((acc, msg) => {
      const from = String(msg.from_user_id);
      acc[from] = acc[from] || [];
      acc[from].push(String(msg._id));
      return acc;
    }, {});

    for (const senderId of Object.keys(bySender)) {
      notifyUser(senderId, "seen", { messageIds: bySender[senderId] });
    }

    res.json({ success: true, updatedCount: updated.modifiedCount ?? updated.nModified });
  } catch (err) {
    console.error("markMessagesSeenController error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};



