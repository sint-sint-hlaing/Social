import express from "express";
import { protect } from "../middlewares/auth.js";
import {
  toggleSavePost,
  getSavedPosts,
} from "../controllers/savedController.js";

const savedRouter = express.Router();

// Toggle save/unsave a post
savedRouter.post("/toggle/:postId", protect, toggleSavePost);

// Get all saved posts for current user
savedRouter.get("/", protect, getSavedPosts);

export default savedRouter;
