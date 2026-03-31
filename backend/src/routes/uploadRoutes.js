const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const uploadController = require("../controllers/uploadController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Configure multer for temporary file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Only ADMIN can upload files
router.post(
  "/upload",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  upload.single("file"),
  uploadController.uploadUsers
);

module.exports = router;