const fs = require("fs");
const path = require("path");

exports.getDashboardData = (req, res) => {
  res.json({
    message: `Welcome ${req.user.username} to Admin Dashboard`,
  });
};

exports.getPublicDashboardData = (req, res) => {
  const filePath = path.join(__dirname, "../../data/public-dashboard.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  res.json(data);
};
