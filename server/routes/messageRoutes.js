import express from "express";
import { upload } from "../config/multer.js";
import { protect } from "../middlewares/auth.js";
import {
  getChatMessages,
  markMessagesSeenController,
  sendMessage,
} from "../controllers/messageController.js";

const messageRouter = express.Router();

// messageRouter.get("/:userId", sseController);  

// Send message (with optional file/image)
messageRouter.post(
  "/send",
  protect,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "file",  maxCount: 1 },
  ]),
  sendMessage
);

// Get chat messages
messageRouter.post("/get", protect, getChatMessages);

// Mark messages as seen
messageRouter.post("/seen", protect, markMessagesSeenController);

export default messageRouter;
