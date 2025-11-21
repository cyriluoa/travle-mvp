import { Router } from "express";
import bcrypt from "bcrypt";
import { query } from "../db.js";
import jwt from "jsonwebtoken";   

const router = Router();
const SALT_ROUNDS = Number(process.env.SALT_ROUNDS || 12);

function signUser(u) {                        // ← add
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET missing");
  return jwt.sign(
    { id: u.id, username: u.username, email: u.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "30d" }
  );
}

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body ?? {};
    if (!username || !email || !password) return res.status(400).json({ error: "Missing fields" });

    const { rows: dupe } = await query(
      `SELECT username, email FROM users WHERE username = $1 OR email = $2 LIMIT 1`,
      [username, email]
    );
    if (dupe.length) {
      const d = dupe[0];
      if (d.username === username && d.email === email) return res.status(409).json({ error: "Username and email already exist" });
      if (d.username === username) return res.status(409).json({ error: "Username already exists" });
      return res.status(409).json({ error: "Email already exists" });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const { rows } = await query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, created_at`,
      [username, email, hash]
    );
    const token = signUser(rows[0]);            
    return res.status(201).json({ token});  
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body ?? {};
    if (!identifier || !password) return res.status(400).json({ error: "Missing fields" });

    const { rows } = await query(
      `SELECT id, username, email, password_hash FROM users WHERE email = $1 OR username = $1 LIMIT 1`,
      [identifier]
    );
    if (!rows.length) return res.status(401).json({ error: "No such email or username" });

    const ok = await bcrypt.compare(password, rows[0].password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    await query(
      `UPDATE users SET last_login_at = now() WHERE id = $1`,
      [rows[0].id]
    );

    const { password_hash, ...safeUser } = rows[0]; // drop hash
    const token = signUser(safeUser);               // ← add
    return res.json({ token });     // ← add
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
