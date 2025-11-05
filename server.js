import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// --- Ensure folders exist ---
const recordingsDir = path.join(__dirname, "recordings");
const alertsDir = path.join(__dirname, "alerts");
if (!fs.existsSync(recordingsDir)) fs.mkdirSync(recordingsDir);
if (!fs.existsSync(alertsDir)) fs.mkdirSync(alertsDir);

// --- Voice Recording Storage Setup ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, recordingsDir),
  filename: (req, file, cb) => {
    const uniqueName = `recording-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// --- Audio Upload Route ---
app.post("/upload", upload.single("audio"), (req, res) => {
  console.log("✅ Audio received:", req.file.filename);
  res.json({ success: true, file: req.file.filename });
});

// --- Quick Shield Alert Route ---
app.post("/quick-shield", (req, res) => {
  try {
    const alertData = {
      userId: req.body.userId || "Guest",
      timestamp: new Date().toISOString(),
      status: "Quick Shield Activated",
    };

    const alertFile = path.join(alertsDir, `alert-${Date.now()}.json`);
    fs.writeFileSync(alertFile, JSON.stringify(alertData, null, 2));
    console.log("🚨 Quick Shield Activated:", alertData);

    res.json({ success: true, message: "Quick Shield alert received", alert: alertData });
  } catch (err) {
    console.error("Error saving quick-shield alert:", err);
    res.status(500).json({ success: false, error: "Could not save alert" });
  }
});

// --- Default Route ---
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "final.html"));
});

app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
