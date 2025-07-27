const express = require("express");
const router = express.Router();
const DeliveryAgent = require("../models/DeliveryAgent");
const Order = require("../models/Order");
const bcrypt = require("bcryptjs");

// Find nearby available agents
router.post("/nearby", async (req, res) => {
  const { lat, lng, radius } = req.body;
  if (lat == null || lng == null || !radius) {
    return res
      .status(400)
      .json({ message: "lat, lng, and radius are required" });
  }
  try {
    const agents = await DeliveryAgent.find({
      isAvailable: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseFloat(radius),
        },
      },
    });
    res.json({ agents });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get agent info and assigned orders
router.get("/:id", async (req, res) => {
  try {
    const agent = await DeliveryAgent.findById(req.params.id);
    if (!agent) return res.status(404).json({ message: "Agent not found" });
    // Find orders assigned to this agent
    const orders = await Order.find({ assignedAgent: agent._id });
    res.json({ agent, orders });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Agent registration
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password, location } = req.body;
    if (!name || !email || !phone || !password || !location) {
      return res.status(400).json({ message: "All fields are required." });
    }
    // Check if agent already exists
    let agent = await DeliveryAgent.findOne({ email });
    if (agent) {
      return res.status(409).json({ message: "Agent already registered." });
    }
    agent = new DeliveryAgent({
      name,
      email,
      phone,
      isAvailable: true,
      location: {
        type: "Point",
        coordinates: [parseFloat(location.lng), parseFloat(location.lat)],
      },
      completedDeliveries: [],
    });
    await agent.save();
    res.status(201).json({ message: "Agent registered successfully.", agent });
  } catch (error) {
    console.error("Agent registration error:", error);
    res
      .status(500)
      .json({ message: "Error registering agent", error: error.message });
  }
});

// Agent login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const agent = await DeliveryAgent.findOne({ email });
    if (!agent) {
      return res.status(400).json({ message: "Agent not found" });
    }
    const isMatch = await bcrypt.compare(password, agent.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }
    res.json({
      message: "Login successful",
      agent: { id: agent._id, name: agent.name, email: agent.email },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
