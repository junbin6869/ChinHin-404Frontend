import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setAuth } from "../auth";
import "./Login.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://404-e7hygxh9bqdudbhq.malaysiawest-01.azurewebsites.net/api";

export default function Login() {
  const [role, setRole] = useState("promotion");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, password }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `Login failed (${res.status})`);
      }

      const data = await res.json();
      setAuth(data.token, data.role);
      navigate("/copilot", { replace: true });
    } catch (err) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
  <div className="login-page">
    <div className="login-card">
      <div className="login-title">Sign in</div>
      <div className="login-subtitle">
        Select your role and enter password (demo password: 123456)
      </div>

      <form onSubmit={onSubmit} className="login-form">
        <div>
          <div className="login-label">Role</div>
          <select
            className="login-select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="promotion">promotion</option>
            <option value="procurement">procurement</option>
            <option value="document">document</option>
            <option value="admin">admin</option>
          </select>
        </div>

        <div>
          <div className="login-label">Password</div>
          <input
            type="password"
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
        </div>

        <button type="submit" className="login-button" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>

        {error && <div className="login-error">⚠ {error}</div>}

        <div className="login-footer">
          Chin Hin Internal System
        </div>
      </form>
    </div>
  </div>
);
}