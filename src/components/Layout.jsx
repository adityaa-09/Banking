import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  FolderKanban,
  Landmark,
  Hash,
  Briefcase,
  CircleDollarSign,
  BarChart3,
  HardDriveDownload,
  History,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";

const ALL_NAV = [
  { id: "dashboard",    label: "Dashboard",           Icon: LayoutDashboard,   roles: ["admin","executive","viewer","finance"] },
  { id: "projects",     label: "Projects / Mandates", Icon: FolderKanban,       roles: ["admin","executive","viewer","finance"] },
  { id: "banks",        label: "Banks & Agreements",  Icon: Landmark,           roles: ["admin","executive","viewer","finance"] },
  { id: "apf",          label: "APF Numbers",         Icon: Hash,               roles: ["admin","executive","viewer","finance"] },
  { id: "cases",        label: "Case Management",     Icon: Briefcase,          roles: ["admin","executive","viewer","finance"] },
  { id: "revenue",      label: "Revenue Tracker",     Icon: CircleDollarSign,   roles: ["admin","executive","viewer","finance"] },
  { id: "userreport",   label: "User Reports",        Icon: BarChart3,          roles: ["admin","executive","viewer","finance"] },
  { id: "exportbackup", label: "Export & Backup",     Icon: HardDriveDownload,  roles: ["admin","executive","finance"] },
  { id: "activitylog",  label: "Activity Log",        Icon: History,            roles: ["admin","executive","finance"] },
  { id: "users",        label: "User Management",     Icon: Users,              roles: ["admin"] },
];

const ROLE_BADGE = {
  admin:     { label: "Admin",     color: "#ef4444", bg: "#ef444420" },
  executive: { label: "Executive", color: "#00d4a1", bg: "#00d4a120" },
  viewer:    { label: "Viewer",    color: "#6366f1", bg: "#6366f120" },
  finance:   { label: "Finance",   color: "#06b6d4", bg: "#06b6d420" },
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
          padding: collapsed ? "16px 10px" : "18px 16px 14px",
          borderBottom: "1px solid var(--border-lt)",
          display: "flex",
          flexDirection: "column",
          alignItems: collapsed ? "center" : "flex-start",
          justifyContent: "center",
          minHeight: 68,
        }}>
          {collapsed ? (
            <img
              src="/beyondwalls-icon.png"
              alt="BeyondWalls"
              style={{
                width: 32,
                height: 32,
                objectFit: "contain",
                display: "block",
              }}
            />
          ) : (
            <div style={{ width: "100%" }}>
              <img
                src="/beyondwalls-dark.png"
                alt="BeyondWalls"
                style={{
                  height: 28,
                  maxWidth: "100%",
                  objectFit: "contain",
                  display: "block",
                }}
              />
              <div style={{
                fontSize: 9,
                color: "var(--accent)",
                letterSpacing: "0.14em",
                fontWeight: 700,
                marginTop: 6,
                paddingLeft: 2,
                textTransform: "uppercase",
              }}>
                Banking Management
              </div>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
          {NAV_ITEMS.map(item => {
            const active = activeTab === item.id;
            const NavIcon = item.Icon;
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
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, flexShrink: 0, color: active ? "var(--accent)" : "var(--text-dim)" }}>
                  <NavIcon size={17} strokeWidth={active ? 2.2 : 1.8} />
                </span>
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
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "space-between",
              gap: 6,
            }}
          >
            {collapsed ? (
              <ChevronRight size={16} />
            ) : (
              <>
                <span style={{ fontSize: 12, fontWeight: 500 }}>Collapse</span>
                <ChevronLeft size={16} />
              </>
            )}
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
            <button onClick={logout} style={{ width:"100%", padding:"8px 0", background:"#ef444418", border:"1px solid #ef444430", borderRadius:8, color:"#f87171", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"var(--font-body)", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              <LogOut size={13} />
              Sign Out
            </button>
          </div>
        )}
        {collapsed && user && (
          <div style={{ borderTop:"1px solid var(--border-lt)", padding:"8px", display:"flex", justifyContent:"center" }}>
            <button onClick={logout} title="Sign Out" style={{ width:36, height:36, background:"#ef444418", border:"1px solid #ef444430", borderRadius:8, color:"#f87171", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
              <LogOut size={16} />
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
            {(() => {
              const currentItem = ALL_NAV.find(n => n.id === activeTab);
              const CurrentIcon = currentItem?.Icon;
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {CurrentIcon && (
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      background: "rgba(0, 212, 161, 0.12)",
                      border: "1px solid rgba(0, 212, 161, 0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--accent)",
                    }}>
                      <CurrentIcon size={15} />
                    </div>
                  )}
                  <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 16, color: "var(--text)" }}>
                    {currentItem?.label}
                  </div>
                </div>
              );
            })()}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {user && (
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span className="tag" style={{ background: ROLE_BADGE[user.role]?.bg, color: ROLE_BADGE[user.role]?.color, fontSize:11 }}>
                  {ROLE_BADGE[user.role]?.label}
                </span>
                <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:7, padding:"5px 14px", fontSize:12, color:"var(--text-muted)", fontWeight: 500 }}>
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
