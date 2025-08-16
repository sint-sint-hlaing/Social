import express from "express";
import { addComment, getComments } from "../controllers/commentController.js";
import { protect } from "../middlewares/auth.js";


const commentRouter = express.Router();

commentRouter.post("/", protect, addComment);
commentRouter.get("/:postId", protect, getComments);


export default commentRouter;
