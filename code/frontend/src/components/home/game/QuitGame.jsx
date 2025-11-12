// src/components/QuitGame.jsx
import { useEffect } from "react";

export default function QuitGame({ open, onCancel, onConfirm }) {
  if (!open) return null;

  // ESC closes
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onCancel?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.6)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quit-title"
        style={{
          width: 420, maxWidth: "90vw",
          background: "rgba(20,25,40,.95)",
          color: "#e6e9ef",
          border: "1px solid rgba(255,255,255,.1)",
          borderRadius: 16, padding: 20, boxShadow: "0 10px 40px rgba(0,0,0,.5)"
        }}
      >
        <h3 id="quit-title" style={{ margin: 0, marginBottom: 8 }}>Quit game?</h3>
        <p style={{ marginTop: 0, opacity: .9 }}>
          Are you sure you want to quit and return to the previous screen?
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "10px 14px", borderRadius: 10,
              border: "1px solid #d0d7de", background: "transparent", color: "#e6e9ef",
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: "10px 14px", borderRadius: 10,
              border: "1px solid #ef4444", background: "#ef4444", color: "white",
              cursor: "pointer"
            }}
          >
            Quit
          </button>
        </div>
      </div>
    </div>
  );
}
