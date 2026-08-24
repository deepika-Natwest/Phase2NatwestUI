const express = require("express");
const router = express.Router();
const { getPrograms, saveProgram, updateProgram, deleteProgram } = require("../controllers/programController");

router.get("/", getPrograms);
router.post("/", saveProgram);         // createProgram
router.post("/save", saveProgram);     // legacy alias
router.put("/:id", updateProgram);     // updateProgram
router.delete("/:id", deleteProgram);  // deleteProgram

module.exports = router;
