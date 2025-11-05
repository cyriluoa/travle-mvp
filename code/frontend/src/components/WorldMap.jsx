// src/App.jsx
import { useEffect, useRef, useState } from "react";
import { feature } from "topojson-client";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { zoom as d3zoom } from "d3-zoom";
import { select } from "d3-selection";

export default function WorldMap() {
  const [countries, setCountries] = useState(null);
  const svgRef = useRef(null);

  useEffect(() => {
    fetch("/data/countries-50m.json")
      .then((r) => r.json())
      .then((topology) => {
        const fc = feature(topology, topology.objects.countries);
        setCountries(fc.features);
      });
  }, []);

  useEffect(() => {
    if (!countries || !svgRef.current) return;

    const width = 960;
    const height = 520;

    const projection = geoNaturalEarth1().fitExtent(
      [
        [10, 10],
        [width - 10, height - 10],
      ],
      { type: "Sphere" }
    );

    const path = geoPath(projection);

    const svg = svgRef.current;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.innerHTML = "";

    // group wrapper for all geometry; zoom transforms this <g>
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svg.appendChild(g);

    // ocean
    const sphere = document.createElementNS("http://www.w3.org/2000/svg", "path");
    sphere.setAttribute("d", path({ type: "Sphere" }));
    sphere.setAttribute("fill", "#e6f2ff");
    sphere.setAttribute("stroke", "none");
    g.appendChild(sphere);

    // countries
    for (const c of countries) {
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", path(c));
      p.setAttribute("fill", "#d0d0d0");
      p.setAttribute("stroke", "#999");
      p.setAttribute("stroke-width", "0.5");

      // store a stable name for filtering
      const name =
        c.properties?.name ||
        c.properties?.ADMIN ||
        c.properties?.NAME ||
        `id:${c.id}`;
      p.dataset.name = name;
      p.classList.add("country");

    
    
      g.appendChild(p);
    }

    // helper: keep borders only for listed country names
    function showBordersOnlyFor(names) {
      const keep = new Set(names.map((s) => s.toLowerCase().trim()));
      const paths = g.querySelectorAll("path.country");
      paths.forEach((el) => {
        const n = el.dataset.name?.toLowerCase() || "";
        if (keep.has(n)) {
          el.style.stroke = "#333";
          el.style.strokeWidth = "0.8";
          el.style.opacity = "1";
        } else {
          el.style.stroke = "none";
          el.style.opacity = "0.6";
        }
      });
    }

    // // example (remove or change as you like):
    showBordersOnlyFor([]);

    // zoom + pan
    const zoom = d3zoom()
      .scaleExtent([1, 10]) // up to 10x
      .translateExtent([[-width, -height], [2 * width, 2 * height]]) // allow panning when zoomed
      .on("zoom", (event) => {
        g.setAttribute("transform", event.transform.toString());
      });

    select(svg).call(zoom);
  }, [countries]);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <svg
        ref={svgRef}
        preserveAspectRatio="xMidYMid meet"
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          background: "white",
          touchAction: "none",
        }}
      />
    </div>
  );
}
