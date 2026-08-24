
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
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
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000,http://127.0.0.1:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
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

const chatbotRoutes = require("./src/routes/chatbotRoutes");
app.use("/api/chatbot", chatbotRoutes);

const pricingRoutes = require("./src/routes/pricingRoutes");
app.use("/api/pricing", pricingRoutes);

const referenceDataRoutes = require("./src/routes/referenceDataRoutes");
app.use("/api/reference-data", referenceDataRoutes);

const userStatusRoutes = require("./src/routes/userStatusRoutes");
app.use("/api/user-statuses", userStatusRoutes);


// Fallback route for unknown endpoints
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});