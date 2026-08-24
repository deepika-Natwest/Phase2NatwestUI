// backend/src/routes/franchiseRoutes.js
const express = require("express");
const router = express.Router();
const franchiseController = require("../controllers/franchiseController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");


// Get all franchises
router.get("/", franchiseController.getAllFranchises);

// Add this **before module.exports**
router.get("/filter", authMiddleware, franchiseController.getFranchisesByCapability);

// CRUD
router.post("/", authMiddleware, roleMiddleware(["ADMIN", "EDITOR"]), franchiseController.createFranchise);
router.put("/:id", authMiddleware, roleMiddleware(["ADMIN", "EDITOR"]), franchiseController.updateFranchise);
router.delete("/:id",  authMiddleware, roleMiddleware(["ADMIN"]), franchiseController.deleteFranchise);

// Get capabilities for select dropdown
router.get("/capabilities", franchiseController.getCapabilities);

module.exports = router;