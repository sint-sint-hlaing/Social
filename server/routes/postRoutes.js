import express from "express";
import { protect } from "../middlewares/auth.js";
import {
  addPost,
  deletePost,
  getFeedPosts,
  likePost,
} from "../controllers/postController.js";
import { upload } from "../config/multer.js";

const postRouter = express.Router();

postRouter.post("/add", upload.array("images", 4), protect, addPost);
postRouter.get("/feed", protect, getFeedPosts);
postRouter.post("/like", protect, likePost);
postRouter.delete("/:id", protect, deletePost)

export default postRouter;
