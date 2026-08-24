const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const dashboardController = require("../controllers/dashboardController");

router.get("/data", dashboardController.getPublicDashboardData);

router.get("/", authMiddleware, dashboardController.getDashboardData);

module.exports = router;
