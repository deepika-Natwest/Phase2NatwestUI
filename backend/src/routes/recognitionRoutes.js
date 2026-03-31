const express = require("express");
const router = express.Router();
const multer = require("multer");

const upload = multer({ dest: "uploads/recognitions/" });

const recognitionController = require("../controllers/recognitionController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");


router.get("/", recognitionController.getAllRecognitions);

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN", "EDITOR"]),
  upload.single("pic"),
  recognitionController.createRecognition
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN", "EDITOR"]),
  upload.single("pic"),
  recognitionController.updateRecognition
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  recognitionController.deleteRecognition
);

module.exports = router;