import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { query } from "../db.js";

const router = Router();

// paths
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const neighbors = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "data", "neighbors.json"), "utf-8")
);
const countries = Object.keys(neighbors);

// helpers
const ymd = (d = new Date()) => d.toISOString().slice(0, 10);

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const seedFromDateStr = (s) => parseInt(s.replaceAll("-", ""), 10);

function shortestPath(a, b) {
  if (a === b) return [a];
  const q = [a];
  const prev = new Map([[a, null]]);
  while (q.length) {
    const v = q.shift();
    for (const w of neighbors[v] || []) {
      if (prev.has(w)) continue;
      prev.set(w, v);
      if (w === b) {
        const path = [];
        for (let cur = w; cur !== null; cur = prev.get(cur)) path.push(cur);
        return path.reverse();
      }
      q.push(w);
    }
  }
  return null;
}

function computeForDate(dateStr) {
  const rng = mulberry32(seedFromDateStr(dateStr));
  for (let i = 0; i < 5000; i++) {
    const a = countries[Math.floor(rng() * countries.length)];
    const b = countries[Math.floor(rng() * countries.length)];
    if (a === b) continue;
    const p = shortestPath(a, b);
    if (!p) continue;

    const countriesApart = p.length - 2; // intermediates only
    if (countriesApart >= 3 && countriesApart <= 5) {
      return { date: dateStr, start: a, end: b, path: p, length: countriesApart };
    }
  }
  throw new Error("No valid 3–5 countries-apart route found");
}

// DB get-or-create for today, safe under concurrency
async function getOrCreateToday() {
  const d = ymd();

  // 1) fast path
  let r = await query("SELECT * FROM daily_routes WHERE date = $1", [d]);
  if (r.rows.length) return r.rows[0];

  // 2) create candidate
  const gen = computeForDate(d);

  // 3) try insert; if another request won the race, fall back to SELECT
  r = await query(
    `INSERT INTO daily_routes (date, start_country, end_country, route, route_length)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (date) DO NOTHING
     RETURNING *`,
    [gen.date, gen.start, gen.end, gen.path, gen.length]
  );
  if (r.rows.length) return r.rows[0];

  // 4) read the row inserted by the other request
  r = await query("SELECT * FROM daily_routes WHERE date = $1", [d]);
  return r.rows[0];
}

// GET /api/random-today
router.get("/", async (_req, res) => {
  try {
    const row = await getOrCreateToday();
    res.json({
      date: row.date,
      start: row.start_country,
      end: row.end_country,
      path: row.route,
      length: row.route_length
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Unable to fetch today's route" });
  }
});

export default router;
