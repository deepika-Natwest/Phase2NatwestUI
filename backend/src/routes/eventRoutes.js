const express = require("express");
const router = express.Router();
const multer = require("multer");

const upload = multer({ dest: "uploads/events/" });

const eventController = require("../controllers/eventController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get("/", eventController.getAllEvents);

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN", "EDITOR"]),
  upload.single("eventImage"),
  eventController.createEvent
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN", "EDITOR"]),
  upload.single("eventImage"),
  eventController.updateEvent
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  eventController.deleteEvent
);

module.exports = router;