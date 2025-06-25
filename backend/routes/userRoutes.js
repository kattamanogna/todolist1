// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ error: "User already exists" });

    const user = new User({ username, email, password });
    const saved = await user.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login with email OR username
router.post("/login", async (req, res) => {
  try {
    const { loginId, password } = req.body;
    const user = await User.findOne({
      $or: [{ email: loginId }, { username: loginId }]
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    res.status(200).json({ message: "Login successful", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
