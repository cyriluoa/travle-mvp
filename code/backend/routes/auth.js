
import { Router } from "express";
import bcrypt from "bcrypt";
import { query } from "../db.js";

const router = Router();
const SALT_ROUNDS = Number(process.env.SALT_ROUNDS || 12);

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
    return res.status(201).json({ user: rows[0] });
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

    return res.json({ id: rows[0].id, username: rows[0].username, email: rows[0].email });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
