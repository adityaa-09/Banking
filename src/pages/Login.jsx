import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck, Lock } from "lucide-react";

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
      minHeight: "100vh",
      background: "radial-gradient(ellipse 120% 90% at 50% -10%, #0e2040 0%, #070e1c 50%, #030710 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* ─── Ambient Glow Blobs ────────────────────────────────────────────── */}
      <div style={{
        position: "absolute",
        top: "-5%",
        left: "15%",
        width: 540,
        height: 540,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0, 212, 161, 0.20) 0%, rgba(0, 212, 161, 0.04) 60%, transparent 75%)",
        filter: "blur(70px)",
        pointerEvents: "none",
        animation: "floatGlow1 16s ease-in-out infinite",
      }} />

      <div style={{
        position: "absolute",
        bottom: "-5%",
        right: "12%",
        width: 560,
        height: 560,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0, 136, 255, 0.22) 0%, rgba(99, 102, 241, 0.06) 60%, transparent 75%)",
        filter: "blur(80px)",
        pointerEvents: "none",
        animation: "floatGlow2 18s ease-in-out infinite",
      }} />

      <div style={{
        position: "absolute",
        top: "40%",
        right: "28%",
        width: 360,
        height: 360,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
        filter: "blur(60px)",
        pointerEvents: "none",
        animation: "pulseSlow 14s ease-in-out infinite",
      }} />

      {/* ─── Cyber Tech Grid Mesh ─────────────────────────────────────────── */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "radial-gradient(rgba(0, 212, 161, 0.14) 1px, transparent 1px), radial-gradient(rgba(0, 136, 255, 0.1) 1px, transparent 1px)",
        backgroundSize: "32px 32px, 96px 96px",
        backgroundPosition: "0 0, 16px 16px",
        maskImage: "radial-gradient(ellipse 85% 75% at 50% 50%, black 35%, transparent 85%)",
        WebkitMaskImage: "radial-gradient(ellipse 85% 75% at 50% 50%, black 35%, transparent 85%)",
        pointerEvents: "none",
      }} />

      {/* ─── Futuristic Radar Rings ───────────────────────────────────────── */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 660,
        height: 660,
        borderRadius: "50%",
        border: "1px dashed rgba(0, 212, 161, 0.12)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 920,
        height: 920,
        borderRadius: "50%",
        border: "1px solid rgba(0, 136, 255, 0.06)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 1200,
        height: 1200,
        borderRadius: "50%",
        border: "1px dashed rgba(99, 102, 241, 0.04)",
        pointerEvents: "none",
      }} />

      {/* ─── Glassmorphism Login Card ─────────────────────────────────────── */}
      <div style={{
        width: "100%",
        maxWidth: 420,
        background: "rgba(10, 18, 36, 0.72)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        border: "1px solid rgba(0, 212, 161, 0.22)",
        borderRadius: 24,
        padding: "40px 36px",
        boxShadow: "0 30px 100px -15px rgba(0, 0, 0, 0.8), 0 0 50px rgba(0, 212, 161, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(0, 212, 161, 0.1)",
            border: "1px solid rgba(0, 212, 161, 0.25)",
            borderRadius: 20,
            padding: "4px 12px",
            fontSize: 11,
            color: "var(--accent)",
            fontWeight: 600,
            letterSpacing: "0.04em",
            marginBottom: 18,
          }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--accent)",
              boxShadow: "0 0 8px var(--accent)",
            }} />
            Banking Management System
          </div>

          <img
            src="/beyondwalls-dark.png"
            alt="BeyondWalls"
            style={{ height: 36, maxWidth: 220, objectFit: "contain", margin: "0 auto 8px", display: "block" }}
          />
          <div style={{ fontSize: 12, color: "var(--text-faint)", letterSpacing: "0.05em", marginTop: 4 }}>
            Enterprise Financial & Loan Operations
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>
              Username
            </label>
            <input
              value={username} onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username or email"
              autoComplete="username" required
              style={{
                width: "100%",
                background: "rgba(6, 12, 24, 0.65)",
                border: "1px solid rgba(30, 58, 95, 0.7)",
                borderRadius: 10,
                padding: "11px 14px",
                color: "var(--text)",
                fontSize: 14,
                outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
              onFocus={e => {
                e.target.style.borderColor = "var(--accent)";
                e.target.style.boxShadow = "0 0 0 3px rgba(0, 212, 161, 0.15)";
              }}
              onBlur={e => {
                e.target.style.borderColor = "rgba(30, 58, 95, 0.7)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div style={{ marginBottom: 22, position: "relative" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>
              Password
            </label>
            <input
              type={showPass ? "text" : "password"}
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password" required
              style={{
                width: "100%",
                paddingRight: 44,
                background: "rgba(6, 12, 24, 0.65)",
                border: "1px solid rgba(30, 58, 95, 0.7)",
                borderRadius: 10,
                padding: "11px 14px",
                color: "var(--text)",
                fontSize: 14,
                outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
              onFocus={e => {
                e.target.style.borderColor = "var(--accent)";
                e.target.style.boxShadow = "0 0 0 3px rgba(0, 212, 161, 0.15)";
              }}
              onBlur={e => {
                e.target.style.borderColor = "rgba(30, 58, 95, 0.7)";
                e.target.style.boxShadow = "none";
              }}
            />
            <button type="button" onClick={() => setShowPass(!showPass)}
              style={{
                position: "absolute",
                right: 12,
                top: 33,
                background: "none",
                border: "none",
                color: "var(--text-faint)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && (
            <div style={{
              background: "#ef444420", border: "1px solid #ef444440",
              borderRadius: 8, padding: "10px 14px",
              fontSize: 13, color: "#f87171", marginBottom: 18,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "13px 0",
            background: loading ? "var(--border)" : "linear-gradient(135deg, #00d4a1 0%, #0088ff 100%)",
            border: "none", borderRadius: 10,
            color: loading ? "var(--text-muted)" : "#060c18",
            fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 15,
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : "0 8px 25px rgba(0, 212, 161, 0.35)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            transition: "all 0.2s ease",
          }}>
            <span>{loading ? "Authenticating…" : "Sign In to Portal"}</span>
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>
      </div>

      {/* ─── Footer Security & Trust Badges ───────────────────────────────── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        marginTop: 22,
        fontSize: 12,
        color: "var(--text-faint)",
        zIndex: 1,
        flexWrap: "wrap",
      }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <ShieldCheck size={14} style={{ color: "var(--accent)" }} /> 256-Bit Bank-Grade Encryption
        </span>
        <span style={{ color: "var(--border)" }}>•</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <Lock size={12} style={{ color: "var(--accent2)" }} /> Authorized Personnel Only
        </span>
      </div>
    </div>
  );
}
