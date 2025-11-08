// routes/reachable.js
import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const router = Router();

// load graph
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const neighbors = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "data", "neighbors.json"), "utf-8")
);

// make graph symmetric
for (const [a, list] of Object.entries(neighbors)) {
  for (const b of list) {
    if (!neighbors[b]) neighbors[b] = [];
    if (!neighbors[b].includes(a)) neighbors[b].push(a);
  }
}

const nameMap = new Map(Object.keys(neighbors).map(k => [k.toLowerCase(), k]));

// ---------- utils ----------
function bfsPath(start, goal) {
  if (start === goal) return [start];
  const q = [start];
  const prev = new Map([[start, null]]);
  while (q.length) {
    const v = q.shift();
    for (const w of neighbors[v] || []) {
      if (prev.has(w)) continue;
      prev.set(w, v);
      if (w === goal) {
        const path = [];
        for (let cur = w; cur !== null; cur = prev.get(cur)) path.push(cur);
        return path.reverse();
      }
      q.push(w);
    }
  }
  return null;
}

function reachableMin2(start) {
  const dist = new Map([[start, 0]]);
  const q = [start];
  while (q.length) {
    const v = q.shift();
    const dv = dist.get(v);
    for (const w of neighbors[v] || []) {
      if (dist.has(w)) continue;
      dist.set(w, dv + 1);
      q.push(w);
    }
  }
  return Array.from(dist.entries())
    .filter(([, d]) => d >= 2)
    .map(([k]) => k)
    .sort();
}

function resolveCountry(input) {
  if (!input || typeof input !== "string") return null;
  return nameMap.get(input.trim().toLowerCase()) || null;
}

// ---------- endpoints ----------

// GET /api/reachable?country=India
router.get("/", (req, res) => {
  const start = resolveCountry(req.query.country);
  if (!start) return res.status(400).json({ error: "Provide ?country=Name (known land country)" });

  const reachable = reachableMin2(start);
  return res.json({ start, reachable });
});

// GET /api/reachable/path?from=India&to=France
router.get("/path", (req, res) => {
  const A = resolveCountry(req.query.from);
  const B = resolveCountry(req.query.to);

  if (!A || !B) return res.status(400).json({ error: "Provide ?from=Name&to=Name" });
  if (A === B) return res.status(400).json({ error: "from and to must differ" });

  const pathArr = bfsPath(A, B);
  if (!pathArr) return res.status(404).json({ error: "No land path exists between the given countries" });

  const edges = pathArr.length - 1;
  const countriesApart = Math.max(pathArr.length - 2, 0); // intermediates only

  return res.json({
    from: A,
    to: B,
    path: pathArr,
    edges,
    countriesApart
  });
});

export default router;
