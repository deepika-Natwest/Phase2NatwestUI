
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

// Routes
const authRoutes = require("./src/routes/authRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const capabilityRoutes = require("./src/routes/capabilityRoutes");
const franchiseRoutes = require("./src/routes/franchiseRoutes");
const userRoutes = require("./src/routes/userRoutes");
const leadershipRoutes = require("./src/routes/leadershipRoutes");
const eventRoutes = require("./src/routes/eventRoutes");
const recognitionRoutes = require("./src/routes/recognitionRoutes");
const deliverableRoutes = require("./src/routes/deliverableRoutes");
const uploadRoutes = require("./src/routes/uploadRoutes");
const programRoutes = require( "./src/routes/programRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.use("/api", authRoutes);
app.use("/api/dashboard", dashboardRoutes);       // Dashboard routes
app.use("/api/capabilities", capabilityRoutes);   // Capability routes
app.use("/api/franchises", franchiseRoutes);
app.use("/api/users", userRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/leadership", leadershipRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/recognition", recognitionRoutes);
app.use("/api/deliverables", deliverableRoutes);
app.use("/api/users", uploadRoutes);
app.use( "/api/programs",  programRoutes);   //program Route


// Fallback route for unknown endpoints
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});