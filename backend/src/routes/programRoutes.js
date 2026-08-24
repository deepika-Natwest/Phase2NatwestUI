const express = require("express");
const router = express.Router();
const {
  getPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
} = require("../controllers/programController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get("/", getPrograms);
router.post("/", authMiddleware, roleMiddleware(["ADMIN", "EDITOR"]), createProgram);
router.put("/:id", authMiddleware, roleMiddleware(["ADMIN", "EDITOR"]), updateProgram);
router.delete("/:id", authMiddleware, roleMiddleware(["ADMIN"]), deleteProgram);

module.exports = router;
