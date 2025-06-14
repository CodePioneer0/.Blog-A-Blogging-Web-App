const express = require("express");
const path = require("path");
const fileupload = require("express-fileupload");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

let initial_path = path.join(__dirname, "public");

const app = express();

// CORS headers for Vercel
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.static(initial_path));
app.use(express.json());
app.use(
  fileupload({
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    abortOnLimit: true,
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);
// Firebase config endpoint for client
app.get("/firebase-config", (req, res) => {
  try {
    const config = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
    };

    // Check if all required env vars are present
    const missingVars = Object.entries(config)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      console.error("Missing environment variables:", missingVars);
      return res.status(500).json({
        error: "Server configuration error",
        missingVars: missingVars,
      });
    }

    res.json(config);
  } catch (error) {
    console.error("Error serving Firebase config:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(initial_path, "home.html"));
});
app.get("/editor", (req, res) => {
  res.sendFile(path.join(initial_path, "editor.html"));
});
app.get("/about", (req, res) => {
  res.sendFile(path.join(initial_path, "about.html"));
});

// Validate file type and name
const validateFile = (file) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: "Invalid file type. Only images are allowed.",
    };
  }

  if (file.size > maxSize) {
    return { valid: false, error: "File too large. Maximum size is 10MB." };
  }

  return { valid: true };
};

app.post("/upload", (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    let file = req.files.image;

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Generate secure filename
    let fileExtension = path.extname(file.name).toLowerCase();
    let secureFilename = uuidv4() + fileExtension;

    // Secure upload path
    let uploadPath = path.join(__dirname, "public", "uploads", secureFilename);

    // Create upload
    file.mv(uploadPath, (err) => {
      if (err) {
        console.error("File upload error:", err);
        return res.status(500).json({ error: "Upload failed" });
      } else {
        // Return relative path for client
        res.json(`uploads/${secureFilename}`);
      }
    });
  } catch (error) {
    console.error("Upload endpoint error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/:blog", (req, res) => {
  res.sendFile(path.join(initial_path, "blog.html"));
});

app.use((req, res) => {
  res.status(404).json({ error: "Page not found" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server Listening on port ${PORT}....`);
});

module.exports = app;
