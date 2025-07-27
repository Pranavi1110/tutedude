const express = require("express");
const router = express.Router();

// GET /api/geocode?address=...
router.get("/", async (req, res) => {
  const address = req.query.address;
  if (!address) {
    return res
      .status(400)
      .json({ message: "Address query parameter is required" });
  }
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      address
    )}`;
    const response = await fetch(url, {
      headers: { "User-Agent": "TutedudeApp/1.0 (your@email.com)" },
    });
    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: "Failed to fetch geocode" });
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Geocoding failed", error: error.message });
  }
});
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// GET /api/geocode/reverse?lat=...&lon=...
router.get("/reverse", async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: "lat and lon are required" });
  }
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
    const response = await fetch(url, {
      headers: { "User-Agent": "TutedudeApp/1.0 (your@email.com)" },
    });
    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: "Failed to fetch address" });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
