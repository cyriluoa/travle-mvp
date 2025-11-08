import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./home.css";

export default function HomePage() {
  const [open, setOpen] = useState(false);

  // countries from public/data/neighbors.json
  const [countries, setCountries] = useState([]);
  const [countrySet, setCountrySet] = useState(new Set());

  // form
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // second field options (reachable >=2 hops)
  const [reachable, setReachable] = useState([]);
  const [loadingReachable, setLoadingReachable] = useState(false);

  // error UI
  const [err, setErr] = useState("");

  const navigate = useNavigate();

  // load country list once from public/data
  useEffect(() => {
    fetch("/data/neighbors.json")
      .then((r) => r.json())
      .then((data) => {
        const list = Object.keys(data).sort();
        setCountries(list);
        setCountrySet(new Set(list.map((x) => x.toLowerCase())));
      })
      .catch(() => {
        // fallback: leave empty; UI will require manual input
      });
  }, []);

  function resetDialog() {
    setFrom("");
    setTo("");
    setReachable([]);
    setErr("");
    setOpen(false);
    setLoadingReachable(false);
  }

  function onOpen() {
    setOpen(true);
    setErr("");
  }

  // when "from" changes: validate, then fetch reachable list
  async function handleFromChange(val) {
    setFrom(val);
    setTo("");
    setReachable([]);
    setErr("");

    const key = val.trim().toLowerCase();
    if (!key || !countrySet.has(key)) {
      // invalid or empty -> keep second disabled
      return;
    }
    setLoadingReachable(true);
    try {
      const res = await fetch(`http://localhost:5000/api/reachable?country=${encodeURIComponent(val.trim())}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        setErr(data.error || "Failed to load reachable countries");
        setReachable([]);
      } else {
        setReachable(data.reachable || []);
        if ((data.reachable || []).length === 0) {
          setErr("No land-reachable countries available from this start.");
        }
      }
    } catch {
      setErr("Network error while loading reachable countries.");
      setReachable([]);
    } finally {
      setLoadingReachable(false);
    }
  }

  // confirm: verify path exists before navigating
  async function onConfirm(e) {
    e.preventDefault();
    setErr("");

    const a = from.trim();
    const b = to.trim();
    if (!a || !b) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/reachable/path?from=${encodeURIComponent(a)}&to=${encodeURIComponent(b)}`
      );
      const data = await res.json();
      if (!res.ok || data.error) {
        setErr(data.error || "No land path exists. Try different countries.");
        return;
      }
      // ok to navigate
      resetDialog();
      navigate(`/play/custom?from=${encodeURIComponent(a)}&to=${encodeURIComponent(b)}`);
    } catch {
      setErr("Network error while verifying route.");
    }
  }

  const toDisabled =
    !from.trim() ||
    !countrySet.has(from.trim().toLowerCase()) ||
    loadingReachable ||
    reachable.length === 0;

  return (
    <div className="home-wrap">
      {/* background blob */}
      <div className="home-bg" />

      {/* top bar */}
      <header className="topbar">
        <div className="brand">
          <span className="dot" />
          travle
        </div>
        <nav className="nav">
          <Link className="nav-link" to="/leaderboard">Leaderboard</Link>
          <Link className="nav-link" to="/learn">Learn Today’s Borders</Link>
        </nav>
      </header>

      {/* content */}
      <main className="content">
        <section className="section">
          <h2 className="title">Play Our Modes</h2>

          <div className="modes">
            {/* Today’s Route */}
            <article className="card">
              <div className="card-head">
                <h3>Today’s Route</h3>
                <span className="badge">Daily</span>
              </div>
              <p className="card-sub">
                One curated path connecting countries. New run every day.
              </p>
              <div className="card-actions">
                <Link className="btn" to="/play/today">Play</Link>
              </div>
            </article>

            {/* Custom Route */}
            <article className="card">
              <div className="card-head">
                <h3>Custom</h3>
                <span className="badge alt">Sandbox</span>
              </div>
              <p className="card-sub">
                Choose a start and an end country. We’ll build the route.
              </p>
              <div className="card-actions">
                <button className="btn" onClick={onOpen}>Build Route</button>
              </div>
            </article>

            {/* Future modes placeholder */}
            <article className="card muted">
              <div className="card-head">
                <h3>Coming soon</h3>
                <span className="badge soon">New</span>
              </div>
              <p className="card-sub">More modes and challenges will appear here.</p>
              <div className="card-actions">
                <button className="btn disabled" disabled>Stay tuned</button>
              </div>
            </article>
          </div>
        </section>
      </main>

      {/* inline modal */}
      {open && (
        <div
          onClick={resetDialog}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 20
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "rgba(20,25,40,.9)",
              border: "1px solid rgba(255,255,255,.1)",
              borderRadius: 16,
              padding: 20,
              minWidth: 360,
              boxShadow: "0 10px 40px rgba(0,0,0,.5)"
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Build Custom Route</h3>

            {err ? (
              <p style={{ color: "#ff9aa2", marginTop: 0, marginBottom: 8 }}>{err}</p>
            ) : null}

            <form onSubmit={onConfirm}>
              <div className="custom-row" style={{ marginBottom: 12 }}>
                {/* From: free text with suggestions from neighbors.json */}
                <input
                  className="input"
                  list="country-list"
                  placeholder="Country A (start)"
                  value={from}
                  onChange={(e) => handleFromChange(e.target.value)}
                />
                <datalist id="country-list">
                  {countries.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>

                <span className="arrow">→</span>

                {/* To: locked to backend-provided reachable options */}
                <select
                  className="input"
                  disabled={toDisabled}
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                >
                  <option value="">
                    {loadingReachable
                      ? "Loading options…"
                      : reachable.length
                      ? "Choose destination"
                      : "No reachable countries"}
                  </option>
                  {reachable.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button type="button" className="btn" onClick={resetDialog}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn"
                  disabled={!from.trim() || !to.trim() || loadingReachable}
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
