import { useEffect, useState } from "react";
import { authedFetch } from "../../utils/auth";
import { Link } from "react-router-dom";
import "./leaderboard.css";

export default function Leaderboard() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState([]);
  const [myIndex, setMyIndex] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setErr("");

      try {
        const lbRes = await authedFetch("http://localhost:5000/api/score/leaderboard");
        const lbJson = await lbRes.json();

        if (!lbRes.ok) throw new Error(lbJson.error || "Failed to load leaderboard");

        if (!ignore) {
          setRows(lbJson.rows || []);
          setMyIndex(lbJson.index);   // <— this is the only thing we need
        }
      } catch (e) {
        if (!ignore) setErr(e.message || "Network error");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => (ignore = true);
  }, []);

  if (loading)
    return (
      <div className="lb-wrap">
        <header className="lb-header">
          <Link to="/home" className="lb-back">← Home</Link>
        </header>
        <main className="lb-main">
          <h2 className="lb-title">Leaderboard</h2>
          <div className="lb-loading">Loading leaderboard…</div>
        </main>
      </div>
    );

  if (err)
    return (
      <div className="lb-wrap">
        <header className="lb-header">
          <Link to="/home" className="lb-back">← Home</Link>
        </header>
        <main className="lb-main">
          <h2 className="lb-title">Leaderboard</h2>
          <div className="lb-error">{err}</div>
        </main>
      </div>
    );

  return (
    <div className="lb-wrap">
      <header className="lb-header">
        <Link to="/home" className="lb-back">← Home</Link>
      </header>

      <main className="lb-main">
        <h2 className="lb-title">Leaderboard</h2>

        {myIndex !== null && (
          <div className="lb-rank">
            Your global rank: <strong>#{myIndex + 1}</strong>
          </div>
        )}

        <div className="lb-card">
          {rows.map((row, idx) => {
            const isMe = idx === myIndex;   // <— highlight current user

            return (
              <div
                key={idx}
                className={`lb-row ${isMe ? "lb-row-me" : ""}`}
              >
                <div className="lb-left">
                  <span className="lb-pos">#{idx + 1}</span>
                  <span className="lb-name">{row.username}</span>
                  {isMe && <span className="lb-you">you</span>}
                </div>

                <div className="lb-score">{row.score}</div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
