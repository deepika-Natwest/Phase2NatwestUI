const fs = require("fs");

exports.readJSON = (filePath) => {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
};

exports.writeJSON = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};