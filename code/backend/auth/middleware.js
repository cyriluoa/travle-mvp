import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "missing token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // payload was signed in auth.js -> { id, username, email }
    req.user = { id: payload.id, username: payload.username, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: "invalid or expired token" });
  }
}