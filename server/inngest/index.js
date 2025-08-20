import { Inngest } from "inngest";
import User from "../models/User.js";
import Connection from "../models/Connection.js";
import sendEmail from "../config/nodeMailer.js";
import Story from "../models/Story.js";
import Message from "../models/Message.js";
import Post from "../models/Post.js";

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "knowledgehive-app",
  webhookSigningSecret: process.env.INNGEST_SIGNING_KEY,
});

// Ingest function to save user data to a database
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    try {
      console.log("syncUserCreation triggered with event:", event);
      const { id, email_addresses, first_name, last_name, image_url } = event.data;
      const email = email_addresses?.[0]?.email_address || "";

      
      // if (!email.toLowerCase().endsWith("@ucsmub.edu.mm")) {
      //   console.log(`Blocked signup for email: ${email}`);
      //   throw new Error("Only @ucsmub.edu.mm emails are allowed to register.");
      // }

      let username = email.split("@")[0] || `user_${Date.now()}`;

      // Check username availability
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        username += Math.floor(Math.random() * 10000);
      }

      const userData = {
        _id: id,
        email,
        full_name: first_name + " " + last_name,
        profile_picture: image_url,
        username,
      };

      await User.create(userData);
    } catch (error) {
      console.error("Error syncing user creation:", error);
      throw error;
    }
  }
);

// Image function to update user data in database
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;

    const updateUserData = {
      email: email_addresses[0].email_address,
      full_name: first_name + " " + last_name,
      profile_picture: image_url,
    };
    await User.findByIdAndUpdate(id, updateUserData);
  }
);

// Image function to delete user data from database
export const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-from-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    const { id } = event.data;

    try {
      // Delete all posts
      if (Post) {
        await Post.deleteMany({ user: id });
      }

      // Delete all stories
      if (Story) {
        await Story.deleteMany({ user: id });
      }

      // Delete user
      await User.findByIdAndDelete(id);

      console.log(`User ${id} and related posts/stories deleted`);
    } catch (error) {
      console.error("Error deleting user data:", error);
      throw error;
    }
  }
);



// Inngest function to send Reminder when a new connection request is added
const sendNewConnectionRequestReminder = inngest.createFunction(
  { id: "send-new-connection-request-reminder" },
  { event: "app/connection-request" },
  async ({ event, step }) => {
    const { connectionId } = event.data;

    await step.run("send-connection-request-mail", async () => {
      const connection = await Connection.findById(connectionId).populate(
        "from_user_id to_user_id"
      );
      const subject = `👋 New Connection Request`;
      const body = `<div style="font-family: Arial, sans-serif; padding: 20px;">
    <h2>Hi ${connection.to_user_id.full_name},</h2>
    <p>You have a new connection request from ${connection.from_user_id.full_name} - @${connection.from_user_id.username}</p>
    <p>Click <a href="${process.env.FRONTEND_URL}/connections" style="color: #10b981;">here</a> to accept or reject the request</p>
    <br/>
    <p>Thanks,<br/>PingUp - Stay Connected</p>
</div>`;

      await sendEmail({
        to: connection.to_user_id.email,
        subject,
        body,
      });
    });
    const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await step.sleepUntil("wait-for-24-hours", in24Hours);
    await step.run("send-connection-request-reminder", async () => {
      const connection = await Connection.findById(connectionId).populate(
        "from_user_id to_user_id"
      );

      if (connection.status === "accepted") {
        return { message: "Already Accepted" };
      }

      const subject = `👋 New Connection Request`;
      const body = `<div style="font-family: Arial, sans-serif; padding: 20px;">
    <h2>Hi ${connection.to_user_id.full_name},</h2>
    <p>You have a new connection request from ${connection.from_user_id.full_name} - @${connection.from_user_id.username}</p>
    <p>Click <a href="${process.env.FRONTEND_URL}/connections" style="color: #10b981;">here</a> to accept or reject the request</p>
    <br/>
    <p>Thanks,<br/>PingUp - Stay Connected</p>
</div>`;

      await sendEmail({
        to: connection.to_user_id.email,
        subject,
        body,
      });
      return { message: "Reminder sent." };
    });
  }
);

export const deleteStory = inngest.createFunction(
  { id: "story-delete" }, // Unique function ID
  { event: "app/story-delete" }, // Event name must match what you send
  async ({ event, step }) => {
    const { storyId } = event.data;

    // Calculate the exact time 24 hours from now
    const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Wait until that time
    await step.sleepUntil("wait-for-24hours", in24Hours);

    // Run deletion logic
    await step.run("delete-story", async () => {
      await Story.findByIdAndDelete(storyId);
      return { message: "Story deleted." };
    });
  }
);

const sendNotificationOfUnseenMessage = inngest.createFunction(
  { id: "send-unseen-messages-notification" },
  { cron: "TZ=America/New_York 0 0 * * *" }, 
  async ({ step }) => {
    const unseenCount = {}; 

    const messages = await Message.find({ seen: false }).populate("to_user_id");

    messages.forEach((message) => {
      if (!message.to_user_id) {
        console.warn("Message with missing recipient:", message._id);
        return; // skip if no recipient
      }
      const userId = message.to_user_id._id.toString();
      unseenCount[userId] = (unseenCount[userId] || 0) + 1;
    });

    for (const userId in unseenCount) {
      const user = await User.findById(userId);
      if (!user) continue; // skip if user was deleted

      const subject = `You have ${unseenCount[userId]} unseen messages`;

      const body = `<div style="font-family: Arial, sans-serif; padding: 20px">
          <h2>Hi ${user.full_name},</h2>
          <p>You have ${unseenCount[userId]} unseen messages</p>
          <p>Click <a href="${process.env.FRONTEND_URL}/messages" style="color: #10b981;">here</a> to view theUp - Stay Connected</p>
        </div>`;

      await sendEmail({
        to: user.email,
        subject,
        body,
      });
    }

    return { message: "Notification sent." };
  }
);


// Create an empty array where we'll export future Inngest functions
export const functions = [
  syncUserCreation,
  syncUserUpdation,
  syncUserDeletion,
  sendNewConnectionRequestReminder,
  deleteStory,
  sendNotificationOfUnseenMessage,
];
