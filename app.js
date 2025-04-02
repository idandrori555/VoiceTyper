const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const app = express();
const port = 3000;

// Set up storage for audio recordings
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `recording-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("audio/")) {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed"));
    }
  },
});

// Serve static files
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Endpoint to save recordings
app.post("/save-recording", upload.single("audio"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No audio file uploaded.");
  }

  const stats = {
    totalWords: req.body.totalWords,
    wordsPerMinute: req.body.wordsPerMinute,
    accuracy: req.body.accuracy,
    filePath: req.file.path,
  };

  // Here you could save these stats to a database

  res.status(200).json({
    message: "Recording saved successfully",
    stats: stats,
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Speech counter app listening at http://localhost:${port}`);
});
