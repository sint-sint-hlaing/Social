import Message from "../models/Message.js";
import imagekit from "../config/imagekit.js";

/**
 * Send message (supports text, image, file)
 */
export const sendMessage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to_user_id, text } = req.body;
    const io = req.app.get("io");

    // defaults
    let message_type = "text";
    let media_url = "";
    let file_name = "";
    let mime_type = "";

    // handle image upload
    if (req.files?.image?.[0]) {
      message_type = "image";
      const file = req.files.image[0];
      const resp = await imagekit.upload({
        file: file.buffer,
        fileName: file.originalname,
      });
      media_url = imagekit.url({ path: resp.filePath });
    } 
    // handle other file upload
    else if (req.files?.file?.[0]) {
      message_type = "file";
      const file = req.files.file[0];
      const resp = await imagekit.upload({
        file: file.buffer,
        fileName: file.originalname,
      });
      media_url = resp.url;
      file_name = file.originalname;
      mime_type = file.mimetype;
    }

    // create message
    const message = await Message.create({
      from_user_id: userId,
      to_user_id,
      text,
      message_type,
      media_url,
      file_name,
      mime_type,
      delivered: false,
      seen: false,
    });

    const messageWithUser = await Message.findById(message._id)
      .populate("from_user_id")
      .lean();

    // emit to recipient if online
    io.to(to_user_id).emit("message", messageWithUser);

    // emit delivered receipt back to sender
    io.to(userId).emit("delivered", {
      messageIds: [String(message._id)],
      to_user_id,
    });

    res.json({ success: true, message: messageWithUser });
  } catch (err) {
    console.error("sendMessage error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


/**
 * Get chat messages and mark incoming as seen
 */
export const getChatMessages = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to_user_id } = req.body;
    const io = req.app.get("io");

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

    const modified = result.modifiedCount ?? result.nModified ?? 0;

    if (modified > 0) {
      const seenMessages = await Message.find({
        from_user_id: to_user_id,
        to_user_id: userId,
        seen: true,
      }).select("_id").lean();

      const messageIds = seenMessages.map((m) => String(m._id));

      // emit seen event to original sender
      io.to(to_user_id).emit("seen", { messageIds, by: String(userId) });
    }

    res.json({ success: true, messages });
  } catch (err) {
    console.error("getChatMessages error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Mark messages seen manually
 */
export const markMessagesSeenController = async (req, res) => {
  try {
    const { messageIds } = req.body;
    if (!Array.isArray(messageIds) || !messageIds.length)
      return res.status(400).json({ success: false, message: "No messageIds provided" });

    const updated = await Message.updateMany(
      { _id: { $in: messageIds } },
      { $set: { seen: true } }
    );

    const io = req.app.get("io");
    const messages = await Message.find({ _id: { $in: messageIds } }).lean();
    const bySender = messages.reduce((acc, msg) => {
      const from = String(msg.from_user_id);
      acc[from] = acc[from] || [];
      acc[from].push(String(msg._id));
      return acc;
    }, {});

    for (const senderId of Object.keys(bySender)) {
      io.to(senderId).emit("seen", { messageIds: bySender[senderId] });
    }

    res.json({ success: true, updatedCount: updated.modifiedCount ?? updated.nModified });
  } catch (err) {
    console.error("markMessagesSeenController error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get recent messages for user
 */
export const getUserRecentMessages = async (req, res) => {
  try {
    const { userId } = req.auth();
    const messages = await Message.find({ to_user_id: userId })
      .populate("from_user_id to_user_id")
      .sort({ createdAt: -1 });

    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
