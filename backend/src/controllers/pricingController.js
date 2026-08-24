const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../../data/pricing.json");

function readPricing() {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function withGrandTotal(rows) {
  return rows.map((row) => {
    const grandTotal = Object.entries(row)
      .filter(([key, value]) => key !== "id" && key !== "category" && Number.isFinite(Number(value)))
      .reduce((total, [, value]) => total + Number(value), 0);

    return { ...row, grandTotal };
  });
}

exports.getPricing = (req, res) => {
  try {
    const pricing = readPricing();
    res.json(Object.fromEntries(Object.entries(pricing).map(([table, rows]) => [table, withGrandTotal(rows)])));
  } catch (error) {
    res.status(500).json({ message: "Unable to load pricing data." });
  }
};