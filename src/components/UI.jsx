import React from "react";
import { Inbox, Calendar, X, AlertTriangle, Check } from "lucide-react";
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
export function KpiCard({ label, value, icon, color = "var(--accent)", sub }) {
  return (
    <div className="card" style={{ padding: "18px 20px", cursor: "default" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: color ? `${color}18` : "rgba(255,255,255,0.05)",
          border: `1px solid ${color ? `${color}30` : "var(--border)"}`,
          color: color || "var(--accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          {React.isValidElement(icon) ? icon : <span style={{ fontSize: 18 }}>{icon}</span>}
        </div>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}60` }} />
      </div>
      <div style={{
        fontFamily: "var(--font-head)", fontSize: 26, fontWeight: 700,
        color, lineHeight: 1.1, marginBottom: 4, letterSpacing: "-0.01em",
      }}>{value}</div>
      <div style={{ fontSize: 12, color: "var(--text-faint)", fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────
export function EmptyState({ icon, message = "No records found" }) {
  return (
    <div style={{
      textAlign: "center", padding: "60px 20px",
      color: "var(--text-faint)", fontSize: 14,
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid var(--border)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
        color: "var(--text-muted)",
      }}>
        {React.isValidElement(icon) ? icon : <Inbox size={22} />}
      </div>
      <div>{message}</div>
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

// ─── DATE PICKER (HYBRID MANUAL TYPING + CALENDAR PICKER) ────────────────────
export function DatePicker({
  value,
  onChange,
  placeholder = "DD/MM/YYYY or YYYY-MM-DD",
  style = {},
  showToday = true,
  disabled = false,
}) {
  const hiddenPickerRef = React.useRef(null);
  const [typedValue, setTypedValue] = React.useState("");
  const [errorHint, setErrorHint] = React.useState(null);

  // Keep typed input in sync with external value
  React.useEffect(() => {
    if (!value) {
      setTypedValue("");
      setErrorHint(null);
      return;
    }
    // If value is ISO YYYY-MM-DD, we can keep it as is or format for display
    setTypedValue(value);
    setErrorHint(null);
  }, [value]);

  const triggerChange = (isoVal) => {
    setErrorHint(null);
    if (typeof onChange === "function") {
      onChange({ target: { value: isoVal } });
    }
  };

  const parseAndApply = (text) => {
    const raw = (text !== undefined ? text : typedValue).trim();
    if (!raw) {
      setErrorHint(null);
      setTypedValue("");
      triggerChange("");
      return;
    }

    const lower = raw.toLowerCase();
    if (lower === "today" || lower === "t") {
      const today = new Date().toISOString().split("T")[0];
      setTypedValue(today);
      triggerChange(today);
      return;
    }
    if (lower === "yesterday" || lower === "y") {
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      const iso = yest.toISOString().split("T")[0];
      setTypedValue(iso);
      triggerChange(iso);
      return;
    }

    // 1. DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
    const dmy = raw.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (dmy) {
      const day = parseInt(dmy[1], 10);
      const mon = parseInt(dmy[2], 10);
      const year = parseInt(dmy[3], 10);
      if (mon >= 1 && mon <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
        const iso = `${year}-${String(mon).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        setTypedValue(iso);
        triggerChange(iso);
        return;
      }
    }

    // 2. DD/MM/YY, DD-MM-YY
    const dmyShort = raw.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})$/);
    if (dmyShort) {
      const day = parseInt(dmyShort[1], 10);
      const mon = parseInt(dmyShort[2], 10);
      const year = 2000 + parseInt(dmyShort[3], 10);
      if (mon >= 1 && mon <= 12 && day >= 1 && day <= 31) {
        const iso = `${year}-${String(mon).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        setTypedValue(iso);
        triggerChange(iso);
        return;
      }
    }

    // 3. DDMMYYYY (8 digits without separator, e.g. 24092026)
    const ddmmyyyy = raw.match(/^(\d{2})(\d{2})(\d{4})$/);
    if (ddmmyyyy) {
      const day = parseInt(ddmmyyyy[1], 10);
      const mon = parseInt(ddmmyyyy[2], 10);
      const year = parseInt(ddmmyyyy[3], 10);
      if (mon >= 1 && mon <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
        const iso = `${year}-${String(mon).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        setTypedValue(iso);
        triggerChange(iso);
        return;
      }
    }

    // 4. ISO YYYY-MM-DD
    const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const mon = parseInt(isoMatch[2], 10);
      const day = parseInt(isoMatch[3], 10);
      if (mon >= 1 && mon <= 12 && day >= 1 && day <= 31) {
        setTypedValue(raw);
        triggerChange(raw);
        return;
      }
    }

    // 5. Fallback native Date parse
    const dt = new Date(raw);
    if (!isNaN(dt.getTime())) {
      const iso = dt.toISOString().split("T")[0];
      setTypedValue(iso);
      triggerChange(iso);
      return;
    }

    // Invalid format
    setErrorHint("Invalid date. Use DD/MM/YYYY or calendar picker");
  };

  const handleOpenCalendar = () => {
    if (disabled) return;
    if (hiddenPickerRef.current) {
      try {
        if (typeof hiddenPickerRef.current.showPicker === "function") {
          hiddenPickerRef.current.showPicker();
        } else {
          hiddenPickerRef.current.focus();
        }
      } catch {
        hiddenPickerRef.current.focus();
      }
    }
  };

  const friendlyDisplay = React.useMemo(() => {
    if (!value || typeof value !== "string") return null;
    try {
      const parts = value.split("-");
      if (parts.length === 3 && parts[0].length === 4) {
        const d = new Date(value + "T00:00:00");
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            weekday: "short",
          });
        }
      }
    } catch {}
    return null;
  }, [value]);

  return (
    <div style={{ position: "relative", width: "100%", ...style }}>
      <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
        <input
          type="text"
          value={typedValue}
          disabled={disabled}
          placeholder={placeholder}
          onChange={e => {
            setErrorHint(null);
            setTypedValue(e.target.value);
            // Auto-parse on complete lengths: DDMMYYYY (8) or DD/MM/YYYY (10)
            const t = e.target.value.trim();
            if (t.length === 8 && /^\d{8}$/.test(t)) {
              parseAndApply(t);
            } else if (t.length === 10 && (/^\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}$/.test(t) || /^\d{4}-\d{2}-\d{2}$/.test(t))) {
              parseAndApply(t);
            }
          }}
          onBlur={() => parseAndApply()}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              parseAndApply();
            }
          }}
          style={{
            paddingRight: disabled ? 12 : (showToday ? 96 : 46),
            fontFamily: "var(--font-body)",
            width: "100%",
            borderColor: errorHint ? "var(--amber)" : undefined,
          }}
        />

        {/* Action Controls inside the input */}
        {!disabled && (
          <div style={{
            position: "absolute",
            right: 6,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}>
            {value && (
              <button
                type="button"
                onClick={() => { setTypedValue(""); triggerChange(""); }}
                title="Clear date"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-faint)",
                  fontSize: 12,
                  cursor: "pointer",
                  padding: "2px 5px",
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={12} />
              </button>
            )}

            {showToday && (
              <button
                type="button"
                onClick={() => {
                  const today = new Date().toISOString().split("T")[0];
                  setTypedValue(today);
                  triggerChange(today);
                }}
                title="Set to Today"
                style={{
                  background: "rgba(0, 212, 161, 0.12)",
                  border: "1px solid rgba(0, 212, 161, 0.3)",
                  color: "var(--accent)",
                  fontSize: 10,
                  fontWeight: 600,
                  borderRadius: 4,
                  padding: "2px 6px",
                  cursor: "pointer",
                }}
              >
                Today
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenCalendar}
              title="Open Calendar Picker"
              style={{
                background: "var(--border)",
                border: "1px solid var(--border-lt)",
                borderRadius: 5,
                padding: "4px 6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent)",
              }}
            >
              <Calendar size={13} />
            </button>
          </div>
        )}

        {/* Native Hidden Date Picker for Calendar UI */}
        <input
          ref={hiddenPickerRef}
          type="date"
          tabIndex={-1}
          disabled={disabled}
          value={value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : ""}
          onChange={e => {
            const val = e.target.value;
            setTypedValue(val);
            triggerChange(val);
          }}
          style={{
            position: "absolute",
            opacity: 0,
            pointerEvents: "none",
            width: 1,
            height: 1,
            right: 0,
            bottom: 0,
          }}
        />
      </div>

      {/* Confirmation or Error message */}
      {errorHint ? (
        <div style={{ fontSize: 10, color: "var(--amber)", marginTop: 3, paddingLeft: 2, display: "flex", alignItems: "center", gap: 3 }}>
          <AlertTriangle size={10} /> {errorHint}
        </div>
      ) : friendlyDisplay ? (
        <div style={{ fontSize: 10, color: "var(--accent)", marginTop: 3, paddingLeft: 2, fontWeight: 500, display: "flex", alignItems: "center", gap: 3 }}>
          <Check size={10} /> {friendlyDisplay}
        </div>
      ) : null}
    </div>
  );
}

// ─── MONTH PICKER (HYBRID MANUAL + CALENDAR) ─────────────────────────────────
export function MonthPicker({
  value,
  onChange,
  placeholder = "YYYY-MM or MM/YYYY",
  style = {},
  showCurrent = true,
  disabled = false,
}) {
  const hiddenMonthRef = React.useRef(null);
  const [typed, setTyped] = React.useState(value || "");

  React.useEffect(() => {
    setTyped(value || "");
  }, [value]);

  const trigger = (val) => {
    if (typeof onChange === "function") {
      onChange({ target: { value: val } });
    }
  };

  const handleOpenCalendar = () => {
    if (disabled) return;
    if (hiddenMonthRef.current) {
      try {
        if (typeof hiddenMonthRef.current.showPicker === "function") {
          hiddenMonthRef.current.showPicker();
        } else {
          hiddenMonthRef.current.focus();
        }
      } catch {
        hiddenMonthRef.current.focus();
      }
    }
  };

  const parseAndApply = (raw = typed) => {
    const s = String(raw).trim();
    if (!s) {
      setTyped("");
      trigger("");
      return;
    }
    const lower = s.toLowerCase();
    if (lower === "now" || lower === "this" || lower === "current") {
      const now = new Date().toISOString().slice(0, 7);
      setTyped(now);
      trigger(now);
      return;
    }
    // MM/YYYY or MM-YYYY
    const my = s.match(/^(\d{1,2})[\/\-](\d{4})$/);
    if (my) {
      const mon = parseInt(my[1], 10);
      const yr = my[2];
      if (mon >= 1 && mon <= 12) {
        const iso = `${yr}-${String(mon).padStart(2, "0")}`;
        setTyped(iso);
        trigger(iso);
        return;
      }
    }
    // YYYY/MM or YYYY-MM
    const ym = s.match(/^(\d{4})[\/\-](\d{1,2})$/);
    if (ym) {
      const yr = ym[1];
      const mon = parseInt(ym[2], 10);
      if (mon >= 1 && mon <= 12) {
        const iso = `${yr}-${String(mon).padStart(2, "0")}`;
        setTyped(iso);
        trigger(iso);
        return;
      }
    }
    // Month name like "Sep 2026" or "September 2026"
    const parsedDt = new Date(`1 ${s}`);
    if (!isNaN(parsedDt.getTime())) {
      const yr = parsedDt.getFullYear();
      const mon = String(parsedDt.getMonth() + 1).padStart(2, "0");
      if (yr >= 1990 && yr <= 2100) {
        const iso = `${yr}-${mon}`;
        setTyped(iso);
        trigger(iso);
        return;
      }
    }
    // ISO YYYY-MM
    if (/^\d{4}-\d{2}$/.test(s)) {
      setTyped(s);
      trigger(s);
      return;
    }
    trigger(s);
  };

  const friendlyDisplay = React.useMemo(() => {
    if (!value || typeof value !== "string") return null;
    const match = value.match(/^(\d{4})-(\d{2})$/);
    if (match) {
      const d = new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, 1);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
      }
    }
    return null;
  }, [value]);

  return (
    <div style={{ position: "relative", width: "100%", ...style }}>
      <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
        <input
          type="text"
          value={typed}
          disabled={disabled}
          placeholder={placeholder}
          onChange={e => {
            setTyped(e.target.value);
            if (e.target.value.length === 7 && (/^\d{4}-\d{2}$/.test(e.target.value) || /^\d{2}[\/\-]\d{4}$/.test(e.target.value))) {
              parseAndApply(e.target.value);
            }
          }}
          onBlur={() => parseAndApply()}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              parseAndApply();
            }
          }}
          style={{ paddingRight: disabled ? 12 : (showCurrent ? 116 : 46), width: "100%" }}
        />
        {!disabled && (
          <div style={{
            position: "absolute",
            right: 6,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}>
            {value && (
              <button
                type="button"
                onClick={() => { setTyped(""); trigger(""); }}
                title="Clear month"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-faint)",
                  fontSize: 12,
                  cursor: "pointer",
                  padding: "2px 4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={12} />
              </button>
            )}
            {showCurrent && (
              <button
                type="button"
                onClick={() => {
                  const now = new Date().toISOString().slice(0, 7);
                  setTyped(now);
                  trigger(now);
                }}
                style={{
                  background: "rgba(0, 212, 161, 0.12)",
                  border: "1px solid rgba(0, 212, 161, 0.3)",
                  color: "var(--accent)",
                  fontSize: 10,
                  fontWeight: 600,
                  borderRadius: 4,
                  padding: "2px 6px",
                  cursor: "pointer",
                }}
              >
                This Month
              </button>
            )}
            <button
              type="button"
              onClick={handleOpenCalendar}
              title="Open Month Picker"
              style={{
                background: "var(--border)",
                border: "1px solid var(--border-lt)",
                borderRadius: 5,
                padding: "4px 6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent)",
              }}
            >
              <Calendar size={13} />
            </button>
          </div>
        )}
        <input
          ref={hiddenMonthRef}
          type="month"
          tabIndex={-1}
          disabled={disabled}
          value={value && /^\d{4}-\d{2}$/.test(value) ? value : ""}
          onChange={e => {
            setTyped(e.target.value);
            trigger(e.target.value);
          }}
          style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 1, height: 1, right: 0, bottom: 0 }}
        />
      </div>
      {friendlyDisplay && (
        <div style={{ fontSize: 10, color: "var(--accent)", marginTop: 3, paddingLeft: 2, fontWeight: 500, display: "flex", alignItems: "center", gap: 3 }}>
          <Check size={10} /> {friendlyDisplay}
        </div>
      )}
    </div>
  );
}
