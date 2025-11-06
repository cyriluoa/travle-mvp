import { useState } from "react";
import "./auth.css";
import MapBg from "./MapBg";
import MailIcon from "./mini-components/MailIcon";
import LockIcon from "./mini-components/LockIcon";
import EyeIcon from "./mini-components/EyeIcon";
import EyeOffIcon from "./mini-components/EyeOffIcon";
import UserIcon from "./mini-components/UserIcon";
import { Link } from "react-router-dom";

function scorePassword(pw) {
  if (!pw) return { score: 0, label: "Too weak" };
  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasDigit = /\d/.test(pw);
  const hasSymbol = /[^A-Za-z0-9]/.test(pw);
  const length = pw.length;

  let score = 0;
  score += hasLower + hasUpper + hasDigit + hasSymbol;
  if (length >= 12) score += 1;
  else if (length >= 8) score += 0.5;

  score = Math.min(4, Math.floor(score));
  const labels = ["Too weak", "Weak", "Okay", "Strong", "Very strong"];
  return { score, label: labels[score] };
}

function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function isValidUsername(v) { return /^[a-z0-9._]{3,30}$/i.test(v); }

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showStrengthCard, setShowStrengthCard] = useState(false);

  const pw = scorePassword(password);
  const reqs = {
    len: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
  const passwordsMatch = password && confirm && password === confirm;

  const formValid =
    isValidUsername(username) &&
    isValidEmail(email) &&
    pw.score >= 3 &&
    passwordsMatch;

  async function onSubmit(e) {
    e.preventDefault();
    if (!formValid) return;
    setError(null); setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Registration failed");
      }
      window.location.href = "/login";
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <MapBg />
      <div className="overlay" />
      <div className="card fade-in">
        <div className="blob1" /><div className="blob2" />

        {/* Floating password strength dropdown card */}
        <section className="corner-card" data-open={showStrengthCard}>
          <button
            type="button"
            className="corner-toggle"
            aria-expanded={showStrengthCard}
            onClick={() => setShowStrengthCard(v => !v)}
          >
            <span className={`dot-grade grade-${pw.score}`} aria-hidden />
            <span>Password strength</span>
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
              <path fill="currentColor" d="M7 10l5 5 5-5z" />
            </svg>
          </button>
          <div className="corner-panel">
            <div className="corner-meter">
              <div
                className={`corner-bar grade-${pw.score}`}
                style={{ width: `${(pw.score / 4) * 100}%` }}
              />
            </div>
            <div className="corner-label">{pw.label}</div>
            <ul className="corner-reqs">
              <li className={reqs.len ? "ok" : "bad"}>At least 8 characters</li>
              <li className={reqs.upper ? "ok" : "bad"}>Uppercase A–Z</li>
              <li className={reqs.lower ? "ok" : "bad"}>Lowercase a–z</li>
              <li className={reqs.digit ? "ok" : "bad"}>Number 0–9</li>
              <li className={reqs.symbol ? "ok" : "bad"}>Symbol !@#$…</li>
            </ul>
          </div>
        </section>

        <div className="card-inner short">
          
          <h1 className="h1">Create account</h1>
          <p className="sub">Username, email, and password</p>

          <form onSubmit={onSubmit} className="form-onecol">
            <label className="label">Username</label>
            <div className="field">
              <span className="icon"><UserIcon /></span>
              <input
                className="input"
                placeholder="yourname"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            {!isValidUsername(username) && username.length > 0 && (
              <div className="hint">3–30 chars. Letters, numbers, dot, underscore.</div>
            )}

            <label className="label">Email</label>
            <div className="field">
              <span className="icon"><MailIcon /></span>
              <input
                className="input"
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {!isValidEmail(email) && email.length > 0 && (
              <div className="hint">Enter a valid email.</div>
            )}

            <label className="label">Password</label>
            <div className="field">
              <span className="icon"><LockIcon /></span>
              <input
                className="input"
                type={showPw ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="toggle"
                aria-label={showPw ? "Hide password" : "Show password"}
                onClick={() => setShowPw((s) => !s)}
              >
                {showPw ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            <div className="meter">
              <div className={`progress grade-${pw.score}`}>
                <div className="progress-bar" style={{ width: `${(pw.score / 4) * 100}%` }} />
              </div>
              <div className="meter-row">
                <span className={`badge grade-${pw.score}`}>{pw.label}</span>
              </div>
            </div>

            <label className="label">Confirm password</label>
            <div className="field">
              <span className="icon"><LockIcon /></span>
              <input
                className="input"
                type="password"
                placeholder="Re-enter password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            {confirm.length > 0 && !passwordsMatch && (
              <div className="hint">Passwords do not match.</div>
            )}

            {error && <div className="error">{error}</div>}

            <button className="btn" type="submit" disabled={!formValid || loading}>
              {loading ? "Creating…" : "Create account"}
            </button>

            <div className="meta">
                Already have an account? <Link to="/login">Sign in</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}