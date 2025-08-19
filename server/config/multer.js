import multer from "multer";

const storage = multer.diskStorage({});

// app.post("/api/post/add", upload.array("images", 10), addPost);

export const upload = multer({ storage });


