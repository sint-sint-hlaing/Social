import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db.js";
import { inngest, functions } from "./inngest/index.js";
import { serve } from "inngest/express";
import { clerkMiddleware } from "@clerk/express";
import userRouter from "./routes/userRoutes.js";
import postRouter from "./routes/postRoutes.js";
import storyRouter from "./routes/storyRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import commentRouter from "./routes/commentRoutes.js";
import savedRouter from "./routes/savedRoutes.js";
import http from "http";
import { Server } from "socket.io"; // <-- import Server

const app = express();

await connectDB();

app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

// Create HTTP server
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://your-client.onrender.com"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // client will send userId after connect
  socket.on("register", (userId) => {
    socket.userId = userId;
    socket.join(userId); // join a room = userId
    console.log(`User ${userId} registered`);
  });

  socket.on("disconnect", () => {
    console.log(`Client ${socket.userId || socket.id} disconnected`);
  });
});

// Make io available in controllers
app.set("io", io);

app.get("/", (req, res) => res.send("Server is running"));
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/user", userRouter);
app.use("/api/post", postRouter);
app.use("/api/story", storyRouter);
app.use("/api/message", messageRouter);
app.use("/api/comments", commentRouter);
app.use("/api/saved", savedRouter);

// Listen on HTTP server, not app
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
