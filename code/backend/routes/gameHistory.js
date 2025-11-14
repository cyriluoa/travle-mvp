import { Router } from "express";
import { requireAuth } from "../auth/middleware.js";
import { query } from "../db.js";

const router = Router();


function formatRoute(list){
    if (!Array.isArray(list)) return "";
    return list
        .map(s => (typeof s == "string" ? s.trim(): ""))
        .filter(Boolean)
        .join("->");
}

/**
 * POST /api/game/complete
 * Body:
 * {
 *   "mode": 0,                                   // 0 = Play Today, 1 = Custom
 *   "fastestRoute": ["Canada","United States of America", ...],
 *   "userRoute":    ["Canada","United States of America", ...],
 *   "maxPoints": 100,
 *   "pointsAwarded": 72
 * }
 * Uses req.user.id from JWT
 */
router.post("/complete", requireAuth, async(req, res) => {
    const userId = req.user.id;
    const mode = Number(req.body?.mode);
    const fastestArr = req.body?.fastestRoute;
    const userArr = req.body?.userRoute;
    const maxPoints = Number(req.body?.maxPoints);
    let pointsAwarded = Number(req.body?.pointsAwarded);

    


    if(!Number.isInteger(mode) || (mode !== 0 && mode !== 1)){
        return res.status(400).json({error:"invalid mode"});
    }
    if(!Array.isArray(fastestArr) || fastestArr.length === 0){
        return res.status(400).json({error: "fastestRoute required"});
    }
    if(!Array.isArray(userArr) || userArr.length === 0){
        return res.status(400).json({error: "userRoute required"});
    }
    if(!Number.isInteger(maxPoints) || maxPoints < 0){
        return res.status(400).json({error: "invalid maxpoints"});
    }
    if(!Number.isInteger(pointsAwarded) || pointsAwarded < 0){
        return res.status(400).json({error: "invalid pointsAwarded"});
    }

    const fastestRoute = formatRoute(fastestArr);
    const userRoute = formatRoute(userArr);

    const insertSql = 'INSERT INTO game_history (user_id, mode, fastest_route, user_route, max_points, points_awarded) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, user_id, mode, fastest_route, user_route, max_points, points_awarded, completed_at';
    try{
        let {rows} = await query(insertSql, [userId, mode, fastestRoute, userRoute, maxPoints, pointsAwarded]);
        return res.status(201).json({
        ...rows[0],
        scored: mode === 0 ? pointsAwarded > 0 : pointsAwarded > 0   // informative flag
        });
    }
    catch(e){
        const UNIQUE_VIOLATION = "23505";
        if (mode === 0 && e?.code === UNIQUE_VIOLATION) {
        try {
            pointsAwarded = 0;
            const { rows } = await query(insertSql, [
            userId, mode, fastestRoute, userRoute, maxPoints, pointsAwarded
            ]);
            return res.status(201).json({
            ...rows[0],
            scored: false
            });
        } catch (e2) {
            console.error(e2);
            return res.status(500).json({ error: "db_error_replay" });
        }
        }

        console.error(e);
        return res.status(500).json({ error: "db_error" });

    }

});


// backend/routes/gameHistory.js

router.get("/todayStatus", requireAuth, async (req, res) => {
  const userId = req.user.id;
  const mode = 0; // Play Today

  // Build [startOfTodayUTC, startOfTomorrowUTC)
  const now = new Date();
  const startUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const endUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );

  const sql = `
    SELECT 1
    FROM public.game_history
    WHERE user_id = $1
      AND mode = $2
      AND points_awarded > 0
      AND completed_at >= $3
      AND completed_at <  $4
    LIMIT 1
  `;

  try {
    const { rows } = await query(sql, [userId, mode, startUtc, endUtc]);
    const played = rows.length > 0;
    return res.json({ played });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "db_error" });
  }
});


export default router;