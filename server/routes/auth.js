const express = require("express");
const router = express.Router();
const User = require("../models/User");

// SESSION-BASED ROLE LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ message: "Email and role are required" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        name: email.split("@")[0],
        email,
        password: "not_applicable", // Dummy password
        role,
        phone: "",
        address: "",
      });
      await user.save();
    } else if (user.role !== role) {
      user.role = role;
      await user.save();
    }

    // Save user in session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    res.json({
      message: "Login successful",
      user: req.session.user,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
});

// ✅ Get current session user
router.get("/me", (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ message: "Not logged in" });
  }
});

// ✅ Logout route
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    res.clearCookie("connect.sid"); // Name may vary depending on config
    res.json({ message: "Logged out successfully" });
  });
});

router.post("/user/address", async (req, res) => {
  try {
    const { supplierId, address } = req.body;
    if (!supplierId || !address) {
      return res.status(400).json({ message: "supplierId and address required" });
    }
    const user = await User.findById(supplierId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.address = address;
    await user.save();
    res.json({ message: "Address updated", address });
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ message: "Error updating address", error: error.message });
  }
});


module.exports = router;
