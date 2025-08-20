import express from "express";
import { upload } from "../config/multer.js";
import { protect } from "../middlewares/auth.js";
import { addUserStory, getStories, viewStory } from "../controllers/storyController.js";

const storyRouter = express.Router();

storyRouter.post("/create", upload.single("media"), protect, addUserStory);
storyRouter.get("/get", protect, getStories);
storyRouter.post("/view/:storyId", protect, viewStory);

export default storyRouter;
