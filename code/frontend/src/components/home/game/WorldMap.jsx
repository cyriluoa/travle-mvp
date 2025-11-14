// src/components/WorldMap.jsx
import { useEffect, useRef, useState, useMemo } from "react";
import { feature } from "topojson-client";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { zoom as d3zoom } from "d3-zoom";
import { select } from "d3-selection";

/**
 * Props:
 * - start, end
 * - shortestPath (string[])
 * - edges (number)
 * - countriesApart (number)
 * - onConnected?: ({steps:number}) => void
 * - onQuit?: () => void
 */
export default function WorldMap({
  start,
  end,
  shortestPath = [],
  edges,
  countriesApart,
  onConnected,
  onQuit,                    // <-- new
})  {
  const [countries, setCountries] = useState(null);
  const [playable, setPlayable] = useState([]);
  const [nameSet, setNameSet] = useState(new Set());
  const [neighbors, setNeighbors] = useState({});
  const [guesses, setGuesses] = useState([]);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);

  const svgRef = useRef(null);

  const COL_START = "#ef4444";
  const COL_END   = "#22c55e";
  const COL_GUESS = "#f59e0b";
  const FILL_DIM  = "#dcdcdc";
  const STROKE_DARK = "#111";
  const STROKE_MED  = "#333";

  const norm = (s) => (s || "").trim().toLowerCase();

  useEffect(() => {
    fetch("/data/countries-50m.json")
      .then((r) => r.json())
      .then((topology) => {
        const fc = feature(topology, topology.objects.countries);
        setCountries(fc.features);
      });
  }, []);

  useEffect(() => {
    fetch("/data/neighbors.json")
      .then((r) => r.json())
      .then((g) => {
        setNeighbors(g);
        const list = Object.entries(g)
          .filter(([, arr]) => Array.isArray(arr) && arr.length > 0)
          .map(([k]) => k)
          .sort();
        setPlayable(list);
        setNameSet(new Set(list.map((x) => norm(x))));
      })
      .catch(() => {
        setNeighbors({});
        setPlayable([]);
        setNameSet(new Set());
      });
  }, []);

  const highlightSet = useMemo(() => {
    return new Set([start, end, ...guesses].map(norm));
  }, [start, end, guesses]);

  const wasConnectedRef = useRef(false);

  useEffect(() => {
    if (!start || !end || !Object.keys(neighbors).length) {
      setConnected(false);
      wasConnectedRef.current = false;
      return;
    }
    const allowed = new Set([start, end, ...guesses]);
    const q = [start];
    const seen = new Set([start]);
    let hit = false;
    while (q.length) {
      const v = q.shift();
      if (v === end) { hit = true; break; }
      for (const w of neighbors[v] || []) {
        if (!allowed.has(w) || seen.has(w)) continue;
        seen.add(w);
        q.push(w);
      }
    }
    setConnected(hit);
    if (hit && !wasConnectedRef.current) {
      wasConnectedRef.current = true;
      onConnected?.({ steps: guesses.length, route: [start, ...guesses, end]});
    }
  }, [start, end, guesses, neighbors, onConnected]);

  useEffect(() => {
    if (!countries || !svgRef.current) return;

    const width = 960, height = 520;
    const projection = geoNaturalEarth1().fitExtent([[10, 10], [width - 10, height - 10]], { type: "Sphere" });
    const path = geoPath(projection);

    const svg = svgRef.current;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.innerHTML = "";

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svg.appendChild(g);

    const sphere = document.createElementNS("http://www.w3.org/2000/svg", "path");
    sphere.setAttribute("d", path({ type: "Sphere" }));
    sphere.setAttribute("fill", "#e6f2ff");
    sphere.setAttribute("stroke", "none");
    g.appendChild(sphere);

    for (const c of countries) {
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", path(c));
      p.setAttribute("fill", FILL_DIM);
      p.setAttribute("stroke", "none");
      p.setAttribute("stroke-width", "0.6");

      const name =
        c.properties?.name || c.properties?.ADMIN || c.properties?.NAME || `id:${c.id}`;
      const nameLc = norm(name);
      p.dataset.name = name;

      if (highlightSet.has(nameLc)) {
        if (norm(start) === nameLc) {
          p.setAttribute("fill", COL_START);
          p.setAttribute("stroke", STROKE_DARK);
          p.setAttribute("stroke-width", "1.2");
        } else if (norm(end) === nameLc) {
          p.setAttribute("fill", COL_END);
          p.setAttribute("stroke", STROKE_DARK);
          p.setAttribute("stroke-width", "1.2");
        } else {
          p.setAttribute("fill", COL_GUESS);
          p.setAttribute("stroke", STROKE_MED);
          p.setAttribute("stroke-width", "0.9");
        }
        p.style.opacity = "1";
      } else {
        p.setAttribute("fill", FILL_DIM);
        p.setAttribute("stroke", "none");
        p.style.opacity = "0.55";
      }
      g.appendChild(p);
    }

    const zoom = d3zoom()
      .scaleExtent([1, 20])
      .translateExtent([[-width, -height], [2 * width, 2 * height]])
      .on("zoom", (event) => g.setAttribute("transform", event.transform.toString()));

    select(svg).call(zoom);
  }, [countries, start, end, highlightSet]);

  function submitGuess(e) {
    e.preventDefault();
    setError("");

    const raw = value.trim();
    if (!raw) return;

    const valid = nameSet.has(norm(raw));
    if (!valid) { setError("Unknown country"); return; }

    const canonical = playable.find((x) => norm(x) === norm(raw)) || raw;
    if (canonical === start || canonical === end) { setError("Already shown"); return; }
    if (guesses.some((g) => norm(g) === norm(canonical))) { setError("Already added"); return; }

    setGuesses((prev) => [...prev, canonical]);
    setValue("");
  }

  const chosenConnections = useMemo(() => {
    const setAll = new Set([start, end, ...guesses]);
    const map = new Map();
    for (const c of guesses) {
      const touches = (neighbors[c] || []).filter((x) => setAll.has(x) && x !== c);
      map.set(c, touches.sort());
    }
    return map;
  }, [guesses, neighbors, start, end]);

  return (
    <div style={{ width: "100vw", height: "100vh", display: "grid", gridTemplateRows: "auto 1fr" }}>
      {/* HUD */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto auto 1fr auto",
          gap: 16,
          alignItems: "center",
          padding: "10px 14px",
          background: "#101828",
          color: "#e6e9ef",
          borderBottom: "1px solid rgba(255,255,255,.08)"
        }}
      >
        <div style={{ fontWeight: 600 }}>
          Start: <span style={{ color: COL_START }}>{start}</span>
        </div>
        <div style={{ fontWeight: 600 }}>
          End: <span style={{ color: COL_END }}>{end}</span>
        </div>

        <div style={{ marginLeft: 16 }}>
          Min borders: <strong>{edges ?? "?"}</strong>
          <span style={{ opacity: 0.7 }}> &nbsp;|&nbsp; in-between: </span>
          <strong>{countriesApart ?? "?"}</strong>
        </div>

        {/* Top-right Quit */}
        <button
          type="button"
          onClick={onQuit}
          style={{
            justifySelf: "end",
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid #ef4444",
            background: "#ef4444",
            color: "white",
            cursor: "pointer"
          }}
        >
          Quit
        </button>
      </div>

      {/* Map + right rail */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", minHeight: 0 }}>
        <svg
          ref={svgRef}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: "100%", height: "100%", display: "block", background: "white", touchAction: "none" }}
        />

        <aside
          style={{
            borderLeft: "1px solid #e6e6e6",
            padding: 12,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            overflow: "auto"
          }}
        >
          <form onSubmit={submitGuess} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              list="all-countries"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Type a country and press Enter"
              autoComplete="off"
              spellCheck="false"
              style={{
                flex: "1 1 auto",
                minWidth: 0,
                padding: "10px 12px",
                border: "1px solid #d0d7de",
                borderRadius: 10,
                outline: "none",
                background: "#fff",
                color: "#111",
                caretColor: "#111",
              }}
            />
            <datalist id="all-countries">
              {playable.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>

            <button
              type="submit"
              style={{
                flex: "0 0 auto",
                width: "auto",
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #111",
                background: "#111",
                color: "white",
                cursor: "pointer",
              }}
            >
              Add
            </button>
          </form>

          {error ? <div style={{ color: "#b42318", fontSize: 13 }}>{error}</div> : null}

          <div
            style={{
              padding: 10,
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              background: "#f8fafc"
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Your countries</div>
            {guesses.length === 0 ? (
              <div style={{ fontSize: 13, opacity: 0.8 }}>No countries added yet.</div>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
                {guesses.map((g) => {
                  const touches = chosenConnections.get(g) || [];
                  const msg =
                    touches.length === 0
                      ? "doesn't touch any in your current set"
                      : `touches: ${touches.join(", ")}`;
                  return (
                    <li key={g} style={{ fontSize: 14 }}>
                      <div style={{ fontWeight: 600 }}>{g}</div>
                      <div style={{ fontSize: 12, opacity: 0.85 }}>{msg}</div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {!connected ? (
            <div
              style={{
                padding: 10,
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                background: "#fff7ed"
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Connection status</div>
              <div style={{ fontSize: 14 }}>Not connected yet.</div>
            </div>
          ) : (
            <div
              style={{
                padding: 12,
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                background: "#ecfdf5"
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Congratulations</div>
              {guesses.length > (countriesApart ?? Number.MAX_SAFE_INTEGER) ? (
                <>
                  <div style={{ fontSize: 14, marginBottom: 6 }}>
                    You connected the countries, but not in the minimum steps.
                  </div>
                  {shortestPath?.length ? (
                    <div style={{ fontSize: 13 }}>
                      Shortest path: {shortestPath.join(" → ")}
                    </div>
                  ) : null}
                </>
              ) : (
                <div style={{ fontSize: 14 }}>
                  You did this in the least possible steps.
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
