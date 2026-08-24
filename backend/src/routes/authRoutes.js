const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt"); // For hashed passwords
const users = require("../../data/users.json");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// ---------------- Login Route ----------------
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Find user by enterpriseId (case-insensitive)
  const user = users.find(
    u => u.enterpriseId.toLowerCase() === username.toLowerCase()
  );
  if (!user) return res.status(401).json({ message: "User not found" });

  let isPasswordValid = false;

  if (user.password.startsWith("$2b$") || user.password.startsWith("$2a$")) {
    // If password is hashed (bcrypt)
    isPasswordValid = bcrypt.compareSync(password, user.password);
  } else {
    // Plain text password
    isPasswordValid = user.password === password;
  }

  if (!isPasswordValid) return res.status(401).json({ message: "Wrong password" });

  // Generate JWT token
  const token = jwt.sign(
    { id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({
    token,
    role: user.role
  });
});

module.exports = router;