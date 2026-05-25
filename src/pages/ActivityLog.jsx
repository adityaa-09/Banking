import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { SectionHeader, FilterSelect, TableCard, EmptyState } from "../components/UI";

export default function ActivityLog() {
  const { cases, users, fetchRecentLogs } = useApp();
  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [fUser, setFUser]       = useState("");
  const [fCase, setFCase]       = useState("");
  const [limit, setLimit]       = useState(50);

  const loadLogs = async (n = 50) => {
    setLoading(true);
    try {
      const result = await fetchRecentLogs(n);
      setLogs(result);
    } catch (e) { console.error(e); setLogs([]); }
    setLoading(false);
  };

  useEffect(() => { loadLogs(limit); }, [limit]);

  const fmtDateTime = (d) => {
    if (!d) return "—";
    try {
      const dt = d?.toDate ? d.toDate() : new Date(d);
      return dt.toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
    } catch { return "—"; }
  };

  // Unique users from logs
  const logUsers = [...new Map(logs.filter(l=>l.userId).map(l=>[l.userId, l.userName])).entries()];
  const logCases = [...new Map(logs.filter(l=>l.caseId).map(l=>[l.caseId, cases.find(c=>c.id===l.caseId)?.clientName||l.caseId])).entries()];

  const filtered = logs.filter(l =>
    (!fUser || l.userId === fUser) &&
    (!fCase || l.caseId === fCase)
  );

  return (
    <div>
      <SectionHeader
        title="Activity Log"
        sub="Track all actions — who did what and when across all cases"
        action={
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={() => loadLogs(limit)}
              style={{ padding:"8px 16px", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:8, color:"var(--text-muted)", fontSize:13, cursor:"pointer", fontFamily:"var(--font-body)" }}>
              🔄 Refresh
            </button>
            <select value={limit} onChange={e => setLimit(Number(e.target.value))}
              style={{ padding:"8px 12px", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:8, color:"var(--text)", fontSize:13 }}>
              <option value={25}>Last 25</option>
              <option value={50}>Last 50</option>
              <option value={100}>Last 100</option>
              <option value={200}>Last 200</option>
            </select>
          </div>
        }
      />

      {/* Filters */}
      <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
        <FilterSelect value={fUser} onChange={setFUser} placeholder="All Users"  options={logUsers} />
        <FilterSelect value={fCase} onChange={setFCase} placeholder="All Cases"  options={logCases} />
        <div style={{ marginLeft:"auto", fontSize:13, color:"var(--text-faint)" }}>
          {filtered.length} entr{filtered.length !== 1 ? "ies" : "y"}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:60, color:"var(--text-faint)" }}>Loading activity logs…</div>
      ) : filtered.length === 0 ? (
        <EmptyState message="No activity logged yet. Activity is tracked when cases are created, edited, or disbursed." />
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
          {/* Timeline */}
          {filtered.map((log, i) => {
            const caseObj = cases.find(c => c.id === log.caseId);
            return (
              <div key={i} style={{
                display:"flex", gap:14,
                padding:"14px 0",
                borderBottom:"1px solid var(--border-lt)",
                alignItems:"flex-start",
              }}>
                {/* Avatar */}
                <div style={{
                  width:36, height:36, borderRadius:"50%",
                  background:"linear-gradient(135deg,#00d4a1,#0088ff)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:14, fontWeight:700, color:"#060c18", flexShrink:0, marginTop:2,
                }}>
                  {(log.userName || "?")[0].toUpperCase()}
                </div>

                {/* Content */}
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, color:"var(--text)", lineHeight:1.5 }}>
                    <span style={{ fontWeight:700, color:"var(--accent)" }}>{log.userName || "Unknown"}</span>
                    {" "}{log.action}
                    {caseObj && (
                      <span style={{ color:"var(--accent2)", marginLeft:4 }}>
                        — {caseObj.clientName}
                      </span>
                    )}
                  </div>
                  {log.field && (
                    <div style={{ fontSize:12, color:"var(--text-faint)", marginTop:2 }}>
                      {log.field}:
                      {log.oldVal && <span style={{ color:"#f87171", marginLeft:4 }}>{log.oldVal}</span>}
                      {log.oldVal && <span style={{ color:"var(--text-dim)", margin:"0 4px" }}>→</span>}
                      {log.newVal && <span style={{ color:"var(--accent)", marginLeft: log.oldVal ? 0 : 4 }}>{log.newVal}</span>}
                    </div>
                  )}
                  <div style={{ fontSize:11, color:"var(--text-dim)", marginTop:4 }}>
                    🕐 {fmtDateTime(log.timestamp)}
                    {log.caseId && (
                      <span style={{ marginLeft:12, color:"var(--text-dim)" }}>
                        Case: {caseObj?.clientName || log.caseId.slice(0,8) + "…"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action tag */}
                <div style={{
                  fontSize:11, padding:"3px 10px", borderRadius:20, flexShrink:0, marginTop:4,
                  background: log.action?.includes("created") ? "#00d4a120"
                    : log.action?.includes("deleted") ? "#ef444420"
                    : log.action?.includes("disbursed") || log.action?.includes("Disbursed") ? "#10b98120"
                    : "#f59e0b20",
                  color: log.action?.includes("created") ? "var(--accent)"
                    : log.action?.includes("deleted") ? "#f87171"
                    : log.action?.includes("disbursed") || log.action?.includes("Disbursed") ? "#34d399"
                    : "#fbbf24",
                }}>
                  {log.action?.includes("created") ? "Created"
                    : log.action?.includes("deleted") ? "Deleted"
                    : log.action?.includes("disbursed") || log.action?.includes("Disbursed") ? "Disbursed"
                    : "Updated"}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && logs.length >= limit && (
        <div style={{ textAlign:"center", paddingTop:20 }}>
          <button onClick={() => setLimit(limit + 50)}
            style={{ padding:"10px 24px", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, color:"var(--text-muted)", fontSize:13, cursor:"pointer", fontFamily:"var(--font-body)" }}>
            Load 50 more
          </button>
        </div>
      )}
    </div>
  );
}
