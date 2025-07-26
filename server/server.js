const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/rasachain";

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "RasaChain API is running",
    timestamp: new Date().toISOString(),
  });
});

// Simple test routes first
app.get("/api/test", (req, res) => {
  res.json({ message: "Test route working" });
});

// Routes - load them one by one to identify the issue
try {
  console.log("Loading vendor routes...");
  app.use("/api/vendor", require("./routes/vendor"));
  console.log("Vendor routes loaded successfully");
} catch (error) {
  console.error("Error loading vendor routes:", error);
}

try {
  console.log("Loading supplier routes...");
  app.use("/api/supplier", require("./routes/supplier"));
  console.log("Supplier routes loaded successfully");
} catch (error) {
  console.error("Error loading supplier routes:", error);
}

try {
  console.log("Loading delivery routes...");
  app.use("/api/delivery", require("./routes/delivery"));
  console.log("Delivery routes loaded successfully");
} catch (error) {
  console.error("Error loading delivery routes:", error);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
