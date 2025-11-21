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


router.get("/leaderboard", requireAuth, async (req, res) => {
  const myId = req.user.id;   // logged-in user

  try {
    // 1) Get top 100 leaderboard rows
    const sql = `
      SELECT id, username, score
      FROM users
      ORDER BY score DESC, id ASC
      LIMIT 100
    `;
    const { rows } = await query(sql);

    // 2) Find user index inside the top 100
    let index = rows.findIndex(row => row.id === myId);

    // 3) If user is NOT in top 100, compute their global rank separately
    if (index === -1) {
      const rankSql = `
        SELECT position FROM (
          SELECT id, ROW_NUMBER() OVER (ORDER BY score DESC, id ASC) AS position
          FROM users
        ) AS ranked
        WHERE id = $1
      `;
      const r = await query(rankSql, [myId]);
      if (r.rows.length > 0) {
        index = r.rows[0].position - 1; // convert to 0-based
      }
    }

    return res.json({ rows, index });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "db_error" });
  }
});



export default router;
