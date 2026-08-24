const express = require("express");
const router = express.Router();
const multer = require("multer");

const upload = multer({ dest: "uploads/leadership/" });

const leadershipController = require("../controllers/leadershipController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");


// Get all leadership (Authenticated users)
router.get("/", leadershipController.getAllLeadership);

// Add leadership (ADMIN + EDITOR)
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN", "EDITOR"]),
  upload.single("profilePic"),
  leadershipController.createLeadership
);

// Update leadership (ADMIN + EDITOR)
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN", "EDITOR"]),
  upload.single("profilePic"),
  leadershipController.updateLeadership
);

// Delete leadership (ADMIN only)
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  leadershipController.deleteLeadership
);

module.exports = router;