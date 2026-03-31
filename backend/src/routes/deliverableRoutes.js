const express = require("express");
const router = express.Router();
const multer = require("multer");

const upload = multer({ dest: "uploads/deliverables/" });

const deliverableController = require("../controllers/deliverableController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");


// Get all deliverables
router.get("/", deliverableController.getDeliverables);

// Create deliverable
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN", "EDITOR"]),
  upload.single("file"),
  deliverableController.createDeliverable
);

// Update deliverable
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN", "EDITOR"]),
  upload.single("file"),
  deliverableController.updateDeliverable
);

// Delete deliverable
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  deliverableController.deleteDeliverable
);

module.exports = router;