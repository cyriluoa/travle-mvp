import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {useEffect, useRef } from "react";


export default function MapBg() {
  const ref = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;

    // Ensure the element has size before Leaflet reads it
    ref.current.style.width = "80%";
    ref.current.style.height = "80%";
    

    const map = L.map(ref.current, {
      worldCopyJump: true,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      tap: false,
      touchZoom: false,
      zoomSnap: 0.25,
    }).setView([20, 0], 2);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      minZoom: 1.5,
      maxZoom: 3.5,
    }).addTo(map);

    mapRef.current = map;
  }, []);

  return (
    <div
      ref={ref}
      className="map-bg"
      aria-hidden
      style={{ filter: "grayscale(1) opacity(0.18) blur(0.5px)" }}
    />
  );
}