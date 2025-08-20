import fs from "fs";
import imagekit from "../config/imagekit.js";
import Story from "../models/Story.js";
import User from "../models/User.js";
import { inngest } from "../inngest/index.js";

// Add User Story
export const addUserStory = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { content, media_type, background_color } = req.body;
    const media = req.file;
    let media_url = ``;

    if (media_type === "image" || media_type === "video") {
      const fileBuffer = fs.readFileSync(media.path);
      const response = await imagekit.upload({
        file: fileBuffer,
        fileName: media.originalname,
      });
      media_url = response.url;
    }

    const story = await Story.create({
      user: userId,
      content,
      media_url,
      media_type,
      background_color,
    });

    // Schedule deletion event
    await inngest.send({
      name: "app/story-delete",
      data: { storyId: story._id },
    });

    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Get Stories (unchanged)
export const getStories = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findById(userId);

    const userIds = [
      userId,
      ...(Array.isArray(user.connections) ? user.connections : []),
      ...(Array.isArray(user.following) ? user.following : []),
    ];

    // Calculate time 24 hours ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const stories = await Story.find({
      user: { $in: userIds },
      createdAt: { $gte: twentyFourHoursAgo },  // Only stories created within last 24h
    })
      .populate("user")
      .sort({ createdAt: -1 });

    res.json({ success: true, stories });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


export const viewStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { userId } = req.auth();

    console.log("Viewing storyId:", storyId, "by userId:", userId);

    const story = await Story.findById(storyId).populate("user", "full_name username");
    if (!story) return res.status(404).json({ success: false, message: "Story not found" });

    // Record the view if the viewer is not the owner
    if (story.user._id.toString() !== userId && !story.viewers.includes(userId)) {
      story.viewers.push(userId);
      await story.save();
    }

    // Populate viewer info only if story owner is requesting
    let viewersData = [];
    if (story.user._id.toString() === userId) {
      await story.populate("viewers", "full_name profile_picture username");
      viewersData = story.viewers;
    }

    res.json({
      success: true,
      story: {
        _id: story._id,
        content: story.content,
        media_url: story.media_url,
        media_type: story.media_type,
        background_color: story.background_color,
        createdAt: story.createdAt,
        user: story.user,
      },
      viewers: viewersData, // only filled for owner
    });
  } catch (error) {
    console.error("Error in viewStory:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};




