import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { SectionHeader, KpiCard } from "../components/UI";
import { exportToExcel, exportToPDF } from "../utils/exportUtils";
import { fmtShort, calcCaseRevenue } from "../utils/helpers";

export default function ExportBackup() {
  const { cases, banks, projects } = useApp();
  const [exporting, setExporting]   = useState(""); // which button is loading
  const [lastBackup, setLastBackup] = useState(() => localStorage.getItem("bw_last_backup"));
  const [filterModel, setFilterModel] = useState("all");   // all | Gross | Net
  const [filterProject, setFilterProject] = useState("all");
  const [filterMonth, setFilterMonth]     = useState("");

  // Apply filters
  const filtered = cases.filter(c => {
    const type = c.loanPayoutType || banks.find(b=>b.id===c.bankId)?.agreementType;
    return (
      (filterModel === "all"   || type === filterModel) &&
      (filterProject === "all" || c.projectId === filterProject) &&
      (!filterMonth            || c.disbursedMonth === filterMonth || c.month === filterMonth)
    );
  });

  // Totals of filtered set
  const totals = filtered.reduce((acc, c) => {
    const bank    = banks.find(b=>b.id===c.bankId);
    const project = projects.find(p=>p.id===c.projectId);
    const fakBank = bank ? { ...bank, agreementType: c.loanPayoutType||bank.agreementType } : bank;
    const rev = calcCaseRevenue(c, fakBank, project);
    acc.income  += rev.bankIncome;
    acc.payout  += rev.devPayout;
    acc.profit  += rev.profit;
    return acc;
  }, { income:0, payout:0, profit:0 });

  const doExport = async (type) => {
    if (filtered.length === 0) { alert("No cases match the current filters."); return; }
    setExporting(type);
    try {
      const fname = `BW_Loans_${filterModel !== "all" ? filterModel + "_" : ""}${filterMonth || "All"}`;
      if (type === "excel") exportToExcel(filtered, banks, projects, fname);
      if (type === "pdf")   exportToPDF(filtered, banks, projects, fname);
      if (type === "backup") {
        exportToExcel(filtered, banks, projects, "BW_Loans_BACKUP");
        localStorage.setItem("bw_last_backup", String(Date.now()));
        setLastBackup(String(Date.now()));
      }
    } catch (e) { alert("Export failed: " + e.message); }
    setExporting("");
  };

  const daysSince = lastBackup
    ? Math.floor((Date.now() - Number(lastBackup)) / (1000*60*60*24))
    : null;

  const months = [...new Set(cases.map(c => c.disbursedMonth || c.month).filter(Boolean))].sort();

  return (
    <div>
      <SectionHeader
        title="Export & Backup"
        sub="Export filtered reports to Excel or PDF, and download full data backups"
      />

      {/* Backup status banner */}
      <div style={{
        background: daysSince === null || daysSince > 7 ? "#f59e0b18" : "#00d4a118",
        border: `1px solid ${daysSince === null || daysSince > 7 ? "#f59e0b40" : "#00d4a130"}`,
        borderRadius: 12, padding: "16px 22px", marginBottom: 28,
        display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
      }}>
        <span style={{ fontSize: 28 }}>💾</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: daysSince === null || daysSince > 7 ? "#fbbf24" : "var(--accent)", marginBottom: 4 }}>
            {daysSince === null ? "No backup taken yet" : daysSince > 7 ? `Last backup ${daysSince} days ago — due for a new one!` : `Last backup ${daysSince === 0 ? "today" : `${daysSince} day${daysSince !== 1?"s":""} ago`} — you're up to date ✓`}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-faint)" }}>
            {cases.length} cases · {banks.length} banks · {projects.length} projects in database
          </div>
        </div>
        <button onClick={() => doExport("backup")} disabled={!!exporting}
          style={{ padding:"11px 24px", background:"#f59e0b", border:"none", borderRadius:10, color:"#060c18", fontWeight:700, fontSize:14, cursor: exporting ? "not-allowed" : "pointer", fontFamily:"var(--font-body)" }}>
          {exporting === "backup" ? "⏳ Exporting…" : "📥 Download Full Backup"}
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <KpiCard label="Total Cases"    value={filtered.length}          icon="📋" color="var(--accent2)" />
        <KpiCard label="Bank Income"    value={fmtShort(totals.income)}  icon="💰" color="var(--accent)"  />
        <KpiCard label="Dev Payout"     value={fmtShort(totals.payout)}  icon="🏗️" color="#f87171"        />
        <KpiCard label="Net Profit"     value={fmtShort(totals.profit)}  icon="📈" color="var(--green)"   />
      </div>

      {/* Filter panel */}
      <div className="card" style={{ padding: 22, marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Filter Export Data</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:600, color:"var(--text-faint)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>
              Payout Model
            </label>
            <select value={filterModel} onChange={e => setFilterModel(e.target.value)}>
              <option value="all">All Models</option>
              <option value="Gross">Gross Only</option>
              <option value="Net">Net Only</option>
            </select>
          </div>
          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:600, color:"var(--text-faint)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>
              Project
            </label>
            <select value={filterProject} onChange={e => setFilterProject(e.target.value)}>
              <option value="all">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:600, color:"var(--text-faint)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>
              Month
            </label>
            <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
              <option value="">All Months</option>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 14, fontSize: 13, color: "var(--text-faint)" }}>
          {filtered.length === cases.length
            ? `Exporting all ${cases.length} cases`
            : `Exporting ${filtered.length} of ${cases.length} cases (filtered)`
          }
        </div>
      </div>

      {/* Export buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Excel */}
        <div className="card" style={{ padding: 28, display:"flex", flexDirection:"column", gap: 16 }}>
          <div style={{ display:"flex", alignItems:"center", gap: 14 }}>
            <div style={{ width:52, height:52, background:"#10b98120", border:"1px solid #10b98140", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26 }}>📊</div>
            <div>
              <div style={{ fontWeight:700, fontSize:16, marginBottom:2 }}>Export to Excel</div>
              <div style={{ fontSize:12, color:"var(--text-faint)" }}>5 sheets: Summary, Cases, Monthly P&L, Project P&L, Bank Summary</div>
            </div>
          </div>
          <div style={{ fontSize:12, color:"var(--text-muted)", lineHeight:1.6 }}>
            Download a <strong style={{ color:"var(--text)" }}>.xlsx</strong> file you can open in Microsoft Excel or Google Sheets.
            All case details, revenue calculations, and breakdowns included.
          </div>
          <button onClick={() => doExport("excel")} disabled={!!exporting || filtered.length === 0}
            style={{ padding:"13px 0", background: exporting==="excel" ? "var(--border)" : "linear-gradient(135deg,#10b981,#059669)", border:"none", borderRadius:10, color: exporting==="excel" ? "var(--text-muted)" : "#fff", fontWeight:700, fontSize:15, cursor: exporting || filtered.length===0 ? "not-allowed" : "pointer", fontFamily:"var(--font-body)", transition:"all 0.2s" }}>
            {exporting === "excel" ? "⏳ Generating Excel…" : "📊 Download Excel Report"}
          </button>
        </div>

        {/* PDF */}
        <div className="card" style={{ padding: 28, display:"flex", flexDirection:"column", gap: 16 }}>
          <div style={{ display:"flex", alignItems:"center", gap: 14 }}>
            <div style={{ width:52, height:52, background:"#ef444420", border:"1px solid #ef444440", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26 }}>📄</div>
            <div>
              <div style={{ fontWeight:700, fontSize:16, marginBottom:2 }}>Export to PDF</div>
              <div style={{ fontSize:12, color:"var(--text-faint)" }}>3 pages: Summary + KPIs, Project & Bank tables, Full case list</div>
            </div>
          </div>
          <div style={{ fontSize:12, color:"var(--text-muted)", lineHeight:1.6 }}>
            Download a <strong style={{ color:"var(--text)" }}>.pdf</strong> report formatted for sharing with management.
            Dark-themed, landscape A4, with revenue highlighted.
          </div>
          <button onClick={() => doExport("pdf")} disabled={!!exporting || filtered.length === 0}
            style={{ padding:"13px 0", background: exporting==="pdf" ? "var(--border)" : "linear-gradient(135deg,#ef4444,#dc2626)", border:"none", borderRadius:10, color: exporting==="pdf" ? "var(--text-muted)" : "#fff", fontWeight:700, fontSize:15, cursor: exporting || filtered.length===0 ? "not-allowed" : "pointer", fontFamily:"var(--font-body)", transition:"all 0.2s" }}>
            {exporting === "pdf" ? "⏳ Generating PDF…" : "📄 Download PDF Report"}
          </button>
        </div>
      </div>

      {/* What's included */}
      <div className="card" style={{ padding: 22, marginTop: 20 }}>
        <div style={{ fontWeight:700, fontSize:13, marginBottom:14 }}>What's included in each export</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, fontSize:12, color:"var(--text-muted)", lineHeight:1.7 }}>
          <div>
            <div style={{ fontWeight:600, color:"var(--text)", marginBottom:6 }}>📊 Excel — 5 Sheets</div>
            <div>• Summary KPIs</div>
            <div>• All Cases (with all fields)</div>
            <div>• Monthly P&L breakdown</div>
            <div>• Project-wise P&L</div>
            <div>• Bank-wise income</div>
          </div>
          <div>
            <div style={{ fontWeight:600, color:"var(--text)", marginBottom:6 }}>📄 PDF — 3 Pages</div>
            <div>• Page 1: Summary + Monthly table</div>
            <div>• Page 2: Project P&L + Bank income</div>
            <div>• Page 3: All cases detail</div>
            <div>• Dark-themed, landscape A4</div>
            <div>• Revenue highlighted in color</div>
          </div>
          <div>
            <div style={{ fontWeight:600, color:"var(--text)", marginBottom:6 }}>💾 Backup</div>
            <div>• Full data export (Excel)</div>
            <div>• All cases with every field</div>
            <div>• Banks + Projects included</div>
            <div>• Backup date recorded</div>
            <div>• Reminder every 7 days</div>
          </div>
        </div>
      </div>
    </div>
  );
}
