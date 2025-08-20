// routes/messageRoutes.js
import express from "express";
import { upload } from "../config/multer.js";
import { protect } from "../middlewares/auth.js";
import {
  getChatMessages,
  sendMessage,
  sseController,
} from "../controllers/messageController.js";

const messageRouter = express.Router();

messageRouter.get("/:userId", sseController);

// protect first, then parse files
messageRouter.post(
  "/send",
  protect,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "file",  maxCount: 1 },
  ]),
  sendMessage
);

messageRouter.post("/get", protect, getChatMessages);

export default messageRouter;
