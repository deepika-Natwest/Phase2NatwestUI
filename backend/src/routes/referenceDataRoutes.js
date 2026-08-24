const express = require("express");
const { getReferenceData } = require("../controllers/referenceDataController");

const router = express.Router();

router.get("/", getReferenceData);

module.exports = router;