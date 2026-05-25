import React from "react";
import { statusTag } from "../utils/helpers";

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
export function SectionHeader({ title, sub, action }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      alignItems: "flex-end", marginBottom: 24,
    }}>
      <div>
        <h2 style={{
          fontFamily: "var(--font-head)", fontSize: 22, fontWeight: 700,
          letterSpacing: "-0.02em", color: "var(--text)",
        }}>{title}</h2>
        {sub && <p style={{ marginTop: 4, fontSize: 13, color: "var(--text-faint)" }}>{sub}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── BUTTON ───────────────────────────────────────────────────────────────────
export function Btn({ children, onClick, variant = "default", size = "md", disabled, style = {} }) {
  const base = {
    cursor: disabled ? "not-allowed" : "pointer",
    border: "none",
    borderRadius: 8,
    fontFamily: "var(--font-body)",
    fontWeight: 500,
    fontSize: size === "sm" ? 12 : 13,
    padding: size === "sm" ? "6px 14px" : "9px 20px",
    transition: "all 0.15s",
    opacity: disabled ? 0.5 : 1,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  };

  const variants = {
    primary: { background: "linear-gradient(135deg,#00d4a1,#0088ff)", color: "#060c18", fontWeight: 700 },
    danger:  { background: "#ef444422", color: "#f87171", border: "1px solid #ef444444" },
    ghost:   { background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)" },
    default: { background: "var(--border)", color: "var(--text)" },
  };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.filter = "brightness(1.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.filter = "none"; }}
    >
      {children}
    </button>
  );
}

// ─── FORM FIELD ───────────────────────────────────────────────────────────────
export function FormField({ label, children, span = 1 }) {
  return (
    <div style={{ gridColumn: `span ${span}` }}>
      <label>{label}</label>
      {children}
    </div>
  );
}

// ─── STATUS TAG ───────────────────────────────────────────────────────────────
export function StatusTag({ status }) {
  return (
    <span className="tag" style={statusTag(status)}>{status}</span>
  );
}

// ─── KPI CARD ────────────────────────────────────────────────────────────────
export function KpiCard({ label, value, icon, color, sub }) {
  return (
    <div className="card" style={{ padding: "18px 20px", cursor: "default" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
      </div>
      <div style={{
        fontFamily: "var(--font-head)", fontSize: 28, fontWeight: 700,
        color, lineHeight: 1, marginBottom: 4,
      }}>{value}</div>
      <div style={{ fontSize: 12, color: "var(--text-faint)", fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────
export function EmptyState({ icon = "📭", message = "No records found" }) {
  return (
    <div style={{
      textAlign: "center", padding: "60px 20px",
      color: "var(--text-faint)", fontSize: 14,
    }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      {message}
    </div>
  );
}

// ─── TABLE WRAPPER ────────────────────────────────────────────────────────────
export function TableCard({ children }) {
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      overflow: "hidden",
    }}>
      <div style={{ overflowX: "auto" }}>
        {children}
      </div>
    </div>
  );
}

// ─── MODAL WRAPPER ────────────────────────────────────────────────────────────
export function Modal({ children, onClose }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {children}
        <Btn onClick={onClose} style={{ width: "100%", marginTop: 20, justifyContent: "center" }}>
          Close
        </Btn>
      </div>
    </div>
  );
}

// ─── DETAIL ROW (in modals) ───────────────────────────────────────────────────
export function DetailGrid({ items }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
      {items.map(([k, v], i) => (
        <div key={i} style={{
          background: "var(--bg-deep)", borderRadius: 8, padding: "10px 14px",
        }}>
          <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>{k}</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{v || "—"}</div>
        </div>
      ))}
    </div>
  );
}

// ─── FILTER BAR ───────────────────────────────────────────────────────────────
export function FilterSelect({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ width: "auto", minWidth: 160, padding: "8px 12px" }}
    >
      <option value="">{placeholder}</option>
      {options.map(([v, l]) => (
        <option key={v} value={v}>{l}</option>
      ))}
    </select>
  );
}

// ─── PANEL (add/edit form container) ─────────────────────────────────────────
export function FormPanel({ title, children, onSave, onCancel, saveLabel = "Save" }) {
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--accent)",
      borderRadius: 12,
      padding: 22,
      marginBottom: 20,
      animation: "slideUp 0.18s ease",
    }}>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: "var(--text)" }}>{title}</div>
      {children}
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <Btn variant="primary" onClick={onSave}>{saveLabel}</Btn>
        <Btn onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  );
}
