const express = require("express");

const router = express.Router();

const {
  getPrograms,
  saveProgram,
} = require("../controllers/programController");

router.get("/", getPrograms);

router.post("/save", saveProgram);

module.exports = router;