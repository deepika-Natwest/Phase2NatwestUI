const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../../data/reference-data.json");

exports.getReferenceData = (req, res) => {
  try {
    res.json(JSON.parse(fs.readFileSync(filePath, "utf8")));
  } catch (error) {
    res.status(500).json({ message: "Unable to load reference data." });
  }
};