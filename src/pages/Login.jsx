import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
// Logo from public folder

export default function Login() {
  const { login, error } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await login(username, password);
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg-base)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", background:"radial-gradient(ellipse 60% 50% at 50% 0%, #00d4a108 0%, transparent 70%)" }} />
      <div style={{
        width: "100%", maxWidth: 400,
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 20, padding: "40px 36px",
        boxShadow: "0 24px 80px rgba(0,0,0,0.4)", position: "relative",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img src="/logo.png" alt="BeyondWalls"
            style={{ width: 100, objectFit: "contain", background: "#fff", borderRadius: 12, padding: 8, marginBottom: 16 }} />
          <div style={{ fontFamily: "var(--font-head)", fontSize: 22, fontWeight: 700, color: "var(--text)" }}>
            BW Loan's
          </div>
          <div style={{ fontSize: 12, color: "var(--text-faint)", letterSpacing: "0.1em", marginTop: 4 }}>
            BANKING MANAGEMENT SYSTEM
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label>Username</label>
            <input
              value={username} onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoComplete="username" required
            />
          </div>

          <div style={{ marginBottom: 20, position: "relative" }}>
            <label>Password</label>
            <input
              type={showPass ? "text" : "password"}
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password" required
              style={{ paddingRight: 44 }}
            />
            <button type="button" onClick={() => setShowPass(!showPass)}
              style={{ position:"absolute", right:12, top:30, background:"none", border:"none", color:"var(--text-faint)", cursor:"pointer", fontSize:14 }}>
              {showPass ? "🙈" : "👁️"}
            </button>
          </div>

          {error && (
            <div style={{
              background: "#ef444420", border: "1px solid #ef444440",
              borderRadius: 8, padding: "10px 14px",
              fontSize: 13, color: "#f87171", marginBottom: 16,
            }}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "12px 0",
            background: loading ? "var(--border)" : "linear-gradient(135deg,#00d4a1,#0088ff)",
            border: "none", borderRadius: 10,
            color: loading ? "var(--text-muted)" : "#060c18",
            fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 15,
            cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s",
          }}>
            {loading ? "Signing in…" : "Sign In →"}
          </button>
        </form>
      </div>
    </div>
  );
}
