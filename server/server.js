const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo"); // optional: persist sessions in MongoDB
require("dotenv").config();

const app = express();

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5175"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ SESSION middleware
app.use(
  session({
    name: "connect.sid",
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // true in production with HTTPS
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
    store: MongoStore.create({
      mongoUrl:
        process.env.MONGODB_URI || "mongodb://localhost:27017/rasachain",
      collectionName: "sessions",
    }),
  })
);

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/rasachain")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((error) => console.error("❌ MongoDB connection error:", error));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/vendor", require("./routes/vendor"));
app.use("/api/supplier", require("./routes/supplier"));
app.use("/api/delivery", require("./routes/delivery"));
app.use("/api/geocode", require("./routes/geocode"));

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "RasaChain API is running",
    timestamp: new Date().toISOString(),
  });
});

// 404
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

// Start Server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
});
