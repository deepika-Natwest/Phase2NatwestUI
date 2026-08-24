const express = require("express");
const { getPricing } = require("../controllers/pricingController");

const router = express.Router();

router.get("/", getPricing);

module.exports = router;