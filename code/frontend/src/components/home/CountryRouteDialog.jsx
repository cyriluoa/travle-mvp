import { useState } from "react";
import "./dialog.css";

export default function CountryRouteDialog({ open, onClose, onConfirm }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!from.trim() || !to.trim()) return;
    onConfirm(from.trim(), to.trim());
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog-card" onClick={(e) => e.stopPropagation()}>
        <h3>Build Custom Route</h3>
        <form onSubmit={handleSubmit}>
          <div className="custom-row">
            <input
              className="input"
              placeholder="Country A (start)"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <span className="arrow">→</span>
            <input
              className="input"
              placeholder="Country B (end)"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="dialog-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn">
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
