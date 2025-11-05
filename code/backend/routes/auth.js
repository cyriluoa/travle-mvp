import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import "dotenv/config";

const router = express.Router();
const USERS_FILE = "./data/users.json";

// ensure file exists
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "{}");

// read & write helpers
const readUsers = () => JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
const writeUsers = (obj) => fs.writeFileSync(USERS_FILE, JSON.stringify(obj, null, 2));

// POST /signup
router.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Missing fields" });

  const users = readUsers();
  if (users[email]) return res.status(400).json({ error: "User exists" });

  const hash = await bcrypt.hash(password, 10);
  users[email] = { hash };
  writeUsers(users);
  res.json({ ok: true });
});

// POST /login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const users = readUsers();
  const user = users[email];
  if (!user) return res.status(400).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.hash);
  if (!valid) return res.status(400).json({ error: "Invalid credentials" });

  const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });
  res.json({ token });
});

// GET /me (auth test)
router.get("/me", (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ user: decoded.email });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
