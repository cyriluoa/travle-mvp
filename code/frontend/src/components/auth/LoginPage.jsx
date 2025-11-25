import { useState } from "react";
import "./auth.css";
import MapBg from "../MapBg";
import MailIcon from "../mini-components/MailIcon";
import LockIcon from "../mini-components/LockIcon";
import EyeIcon from "../mini-components/EyeIcon";
import EyeOffIcon from "../mini-components/EyeOffIcon";
import { useNavigate, Link } from "react-router-dom";


export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const API = import.meta.env.APP_BACKEND_URL;
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error || "Invalid credentials");
    }
    const body = await res.json(); 
    localStorage.setItem("token", body.token);
    navigate("/home", { replace: true });

    } catch (err) {
      setError(err.message || "Login failed");
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
        <div className="card-inner">
          <h1 className="h1">Welcome back</h1>
          <p className="sub">Sign in with your username or email</p>

          <form onSubmit={onSubmit}>
            <label className="label">Username or Email</label>
            <div className="field">
              <span className="icon"><MailIcon /></span>
              <input
                className="input"
                placeholder="you@domain.com or username"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>

            <label className="label">Password</label>
            <div className="field">
              <span className="icon"><LockIcon /></span>
              <input
                className="input"
                type={showPw ? "text" : "password"}
                placeholder="Password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle"
                aria-label={showPw ? "Hide password" : "Show password"}
                onClick={() => setShowPw(s => !s)}
              >
                {showPw ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            <div className="row-right">
              <a href="/forgot" className="link-muted">Forgot password?</a>
            </div>

            {error && <div className="error">{error}</div>}

            <button className="btn" type="submit" disabled={loading || !identifier || !password}>
              {loading ? "Signing in…" : "Sign in"}
            </button>

            <div className="meta">
                Haven't created an account yet? <Link to="/register">Register here</Link>
            </div>
          </form>

          <div className="small">Protected by bcrypt. No social sign-in yet.</div>
        </div>
      </div>
    </div>
  );
}
