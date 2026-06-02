const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { requireAuth, JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

const TOKEN_TTL = "7d";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: TOKEN_TTL,
  });
}

// POST /api/auth/register
router.post("/register", (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "A valid email is required" });
  }
  if (!password || password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });
  }

  const existing = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: "Email is already registered" });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)")
    .run(email.toLowerCase(), password_hash);

  const user = { id: info.lastInsertRowid, email: email.toLowerCase() };
  return res.status(201).json({ token: signToken(user), user });
});

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const row = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.toLowerCase());

  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const user = { id: row.id, email: row.email };
  return res.json({ token: signToken(user), user });
});

// GET /api/auth/me  (protected)
router.get("/me", requireAuth, (req, res) => {
  const row = db
    .prepare("SELECT id, email, created_at FROM users WHERE id = ?")
    .get(req.user.id);

  if (!row) return res.status(404).json({ error: "User not found" });
  return res.json({ user: row });
});

module.exports = router;
