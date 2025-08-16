import express from "express";
import { addComment, deleteComment, getComments } from "../controllers/commentController.js";
import { protect } from "../middlewares/auth.js";


const commentRouter = express.Router();

commentRouter.post("/", protect, addComment);
commentRouter.get("/:postId", protect, getComments);
commentRouter.delete("/:commentId", deleteComment);

export default commentRouter;
