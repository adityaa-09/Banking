import { exportToExcel } from "../utils/exportUtils";
import React, { useState } from "react";
import { useApp } from "../context/AppContext";

// Helper: build and download Excel backup using SheetJS
async function downloadBackup(cases, banks, projects) {
  try {
    // Use shared export utility
    exportToExcel(cases, banks, projects, 'BW_Loans_Backup');
    return true;
  } catch(e) { alert('Backup failed: ' + e.message); return false; }
}
async function _unused(cases, banks, projects) {
  try {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();

    // Cases sheet
    const caseRows = cases.map(c => {
      const bank    = banks.find(b => b.id === c.bankId);
      const project = projects.find(p => p.id === c.projectId);
      return {
        "Client Name":      c.clientName || "",
        "Phone":            c.clientPhone || "",
        "Email":            c.clientEmail || "",
        "Project":          project?.name || "",
        "Bank":             bank?.name || "",
        "Payout Model":     c.loanPayoutType || bank?.agreementType || "",
        "Loan Amount":      c.loanAmt || 0,
        "Sanctioned Amt":   c.sanctionedAmt || 0,
        "Disbursed Amt":    c.disbursedAmt || 0,
        "Status":           c.status || "",
        "Month":            c.month || "",
        "Disbursed Month":  c.disbursedMonth || "",
        "Sales POC":        c.salesPoc || "",
        "Sanction Date":    c.sanctionDate || "",
        "Disbursed Date":   c.disbursedDate || "",
        "Sanction Doc":     c.sanctionDoc || "",
        "Drive Link":       c.driveLink || "",
        "Remarks":          c.remarks || "",
        "Created By":       c.createdByName || "",
      };
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(caseRows), "Cases");

    // Banks sheet
    const bankRows = banks.map(b => ({
      "Bank Name": b.name, "Agreement Type": b.agreementType,
      "Commission %": b.agreementPct, "Agreement Date": b.agreementDate || "",
      "Drive Link": b.driveLink || "", "Remarks": b.remarks || "",
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bankRows), "Banks");

    // Projects sheet
    const projRows = projects.map(p => ({
      "Project Name": p.name, "Developer": p.developer, "Location": p.location,
      "Type": p.type, "Status": p.status, "Units": p.totalUnits,
      "Dev Payout %": p.developerPayoutPct || 0, "Notes": p.notes || "",
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(projRows), "Projects");

    const date = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `BW_Loans_Backup_${date}.xlsx`);
    localStorage.setItem("bw_last_backup", String(Date.now()));
    return true;
  } catch (e) {
    alert("Backup failed: " + e.message);
    return false;
  }
}

export default function BackupReminder({ alwaysShow = false }) {
  const { cases, banks, projects } = useApp();
  const [exporting, setExporting] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    if (alwaysShow) return false;
    const last = localStorage.getItem("bw_last_backup");
    if (!last) return false;
    const daysSince = (Date.now() - Number(last)) / (1000 * 60 * 60 * 24);
    return daysSince < 7;
  });

  const lastBackup = localStorage.getItem("bw_last_backup");
  const daysSince  = lastBackup ? Math.floor((Date.now() - Number(lastBackup)) / (1000 * 60 * 60 * 24)) : null;

  if (dismissed && !alwaysShow) return null;

  const doBackup = async () => {
    setExporting(true);
    const ok = await downloadBackup(cases, banks, projects);
    if (ok) setDismissed(true);
    setExporting(false);
  };

  return (
    <div style={{
      background: alwaysShow ? "var(--bg-card)" : "#f59e0b18",
      border: `1px solid ${alwaysShow ? "var(--border)" : "#f59e0b40"}`,
      borderRadius: 12, padding: "14px 20px", marginBottom: 20,
      display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
    }}>
      <span style={{ fontSize: 24 }}>💾</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: alwaysShow ? "var(--text)" : "#fbbf24" }}>
          {alwaysShow ? "Data Backup" : "Backup Reminder"}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>
          {lastBackup
            ? `Last backup: ${daysSince === 0 ? "today" : `${daysSince} day${daysSince !== 1 ? "s" : ""} ago`} · ${cases.length} cases, ${banks.length} banks, ${projects.length} projects`
            : `No backup yet · ${cases.length} cases, ${banks.length} banks, ${projects.length} projects`
          }
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={doBackup} disabled={exporting}
          style={{ padding:"9px 20px", background: exporting ? "var(--border)" : "#f59e0b", border:"none", borderRadius:8, color: exporting ? "var(--text-muted)" : "#060c18", fontWeight:700, fontSize:13, cursor: exporting ? "not-allowed" : "pointer", fontFamily:"var(--font-body)" }}>
          {exporting ? "Exporting…" : "📊 Export Backup"}
        </button>
        {!alwaysShow && (
          <button onClick={() => setDismissed(true)}
            style={{ padding:"9px 14px", background:"transparent", border:"1px solid var(--border)", borderRadius:8, color:"var(--text-faint)", fontSize:12, cursor:"pointer", fontFamily:"var(--font-body)" }}>
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
