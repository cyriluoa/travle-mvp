import { Link } from "react-router-dom";
import "./home.css";

export default function HomePage() {
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
                <Link className="btn" to="/play/custom">Build Route</Link>
              </div>
              <div className="custom-row">
                <input className="input" placeholder="Country A (start)" />
                <span className="arrow">→</span>
                <input className="input" placeholder="Country B (end)" />
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
    </div>
  );
}
