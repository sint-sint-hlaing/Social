// config/multer.js
import multer from "multer";

const storage = multer.memoryStorage(); // get Buffer directly
export const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
});
