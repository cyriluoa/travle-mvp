// backend/routes/score.js
import { Router } from "express";
import { requireAuth } from "../auth/middleware.js";
import { query } from "../db.js";

const router = Router();

/**
 * POST /api/score/add
 * Body: { points: number }  // non-negative integer
 * Uses req.user.id from JWT
 */
router.post("/add", requireAuth, async (req, res) => {
  const { points } = req.body ?? {};
  if (!Number.isInteger(points) || points < 0) {
    return res.status(400).json({ error: "points must be a non-negative integer" });
  }

  try {
    const { rows } = await query(
      `UPDATE public.users
         SET score = score + $1
       WHERE id = $2
       RETURNING id, username, email, score`,
      [points, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: "user not found" });
    return res.json({ user: rows[0] });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "db_error" });
  }
});

export default router;
