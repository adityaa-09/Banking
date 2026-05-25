import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
// Logo loaded from public folder

const ALL_NAV = [
  { id: "dashboard",  label: "Dashboard",           icon: "📊", roles: ["admin","executive","viewer"] },
  { id: "projects",   label: "Projects / Mandates", icon: "🏗️", roles: ["admin","executive","viewer"] },
  { id: "banks",      label: "Banks & Agreements",  icon: "🏦", roles: ["admin","executive","viewer"] },
  { id: "apf",        label: "APF Numbers",         icon: "🔢", roles: ["admin","executive","viewer"] },
  { id: "cases",      label: "Case Management",     icon: "📋", roles: ["admin","executive","viewer"] },
  { id: "revenue",    label: "Revenue Tracker",     icon: "📈", roles: ["admin","executive","viewer"] },
  { id: "userreport", label: "User Reports",        icon: "👤", roles: ["admin","executive","viewer"] },
  { id: "exportbackup",label: "Export & Backup",    icon: "📤", roles: ["admin","executive"] },
  { id: "activitylog", label: "Activity Log",        icon: "📜", roles: ["admin","executive"] },
  { id: "users",      label: "User Management",     icon: "👥", roles: ["admin"] },
];

const ROLE_BADGE = {
  admin:     { label: "Admin",     color: "#ef4444", bg: "#ef444420" },
  executive: { label: "Executive", color: "#00d4a1", bg: "#00d4a120" },
  viewer:    { label: "Viewer",    color: "#6366f1", bg: "#6366f120" },
};

export default function Layout({ activeTab, setActiveTab, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const NAV_ITEMS = ALL_NAV.filter(n => !user || n.roles.includes(user.role));

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 64 : 234,
        background: "var(--bg-deep)",
        borderRight: "1px solid var(--border-lt)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s",
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? "14px 10px" : "14px 16px",
          borderBottom: "1px solid var(--border-lt)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          minHeight: 64,
        }}>
          <img
            src="/logo.png"
            alt="BeyondWalls"
            onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }}
            style={{
              width: 38,
              height: 38,
              objectFit: "contain",
              flexShrink: 0,
              borderRadius: 7,
              background: "#ffffff",
              padding: 4,
            }}
          />
          {!collapsed && (
            <div style={{ overflow: "hidden" }}>
              <div style={{
                fontFamily: "var(--font-head)",
                fontWeight: 700,
                fontSize: 15,
                letterSpacing: "-0.02em",
                whiteSpace: "nowrap",
                color: "var(--text)",
              }}>BW Loan's</div>
              <div style={{ fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
                BANKING MANAGEMENT
              </div>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
          {NAV_ITEMS.map(item => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={collapsed ? item.label : ""}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: collapsed ? "10px 0" : "10px 12px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  background: active ? "#00d4a114" : "transparent",
                  border: active ? "1px solid #00d4a130" : "1px solid transparent",
                  borderRadius: 8,
                  color: active ? "var(--accent)" : "var(--text-muted)",
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  cursor: "pointer",
                  marginBottom: 2,
                  transition: "all 0.15s",
                  textAlign: "left",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "#1a2744"; e.currentTarget.style.color = "var(--text)"; }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div style={{ borderTop: "1px solid var(--border-lt)", padding: "12px 8px" }}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              width: "100%",
              padding: "8px",
              background: "transparent",
              border: "none",
              color: "var(--text-faint)",
              cursor: "pointer",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-end",
              gap: 6,
            }}
          >
            {collapsed ? "→" : <><span style={{ fontSize: 12 }}>Collapse</span><span>←</span></>}
          </button>
        </div>

        {/* User info + logout */}
        {!collapsed && user && (
          <div style={{ borderTop:"1px solid var(--border-lt)", padding:"12px 10px" }}>
            <div style={{ background:"var(--bg-base)", borderRadius:8, padding:"8px 12px", marginBottom:8 }}>
              <div style={{ fontWeight:600, fontSize:13, color:"var(--text)", marginBottom:4 }}>{user.name}</div>
              <span className="tag" style={{ background:ROLE_BADGE[user.role]?.bg, color:ROLE_BADGE[user.role]?.color, fontSize:10 }}>
                {ROLE_BADGE[user.role]?.label}
              </span>
            </div>
            <button onClick={logout} style={{ width:"100%", padding:"8px 0", background:"#ef444418", border:"1px solid #ef444430", borderRadius:8, color:"#f87171", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"var(--font-body)" }}>
              Sign Out
            </button>
          </div>
        )}
        {collapsed && user && (
          <div style={{ borderTop:"1px solid var(--border-lt)", padding:"8px", display:"flex", justifyContent:"center" }}>
            <button onClick={logout} title="Sign Out" style={{ width:36, height:36, background:"#ef444418", border:"1px solid #ef444430", borderRadius:8, color:"#f87171", fontSize:16, cursor:"pointer" }}>
              ⏻
            </button>
          </div>
        )}
      </aside>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <header style={{
          height: 54,
          background: "var(--bg-deep)",
          borderBottom: "1px solid var(--border-lt)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/logo.png" alt="BW"
            onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }}
            style={{ width: 24, height: 24, objectFit: "contain", background: "#fff", borderRadius: 4, padding: 2 }} />
          <div style={{ display:"none", width:24, height:24, background:"linear-gradient(135deg,#00d4a1,#0088ff)", borderRadius:4, alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:10, color:"#060c18", flexShrink:0 }}>BW</div>
            <div style={{ fontFamily: "var(--font-head)", fontWeight: 600, fontSize: 15, color: "var(--text)" }}>
              {ALL_NAV.find(n => n.id === activeTab)?.label}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 7,
              padding: "4px 14px",
              fontSize: 12,
              color: "var(--accent)",
              fontWeight: 600,
            }}>FY 2024–25</div>
            {user && (
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span className="tag" style={{ background: ROLE_BADGE[user.role]?.bg, color: ROLE_BADGE[user.role]?.color, fontSize:11 }}>
                  {ROLE_BADGE[user.role]?.label}
                </span>
                <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:7, padding:"4px 14px", fontSize:12, color:"var(--text-muted)" }}>
                  {user.name}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
