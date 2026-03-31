exports.getDashboardData = (req, res) => {
  res.json({
    message: `Welcome ${req.user.username} to Admin Dashboard`,
  });
};