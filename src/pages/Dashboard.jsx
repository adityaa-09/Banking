import React, { useMemo } from "react";
import { useApp } from "../context/AppContext";
import { SectionHeader, KpiCard } from "../components/UI";
import { fmtShort, calcCaseRevenue, statusTag } from "../utils/helpers";
import BackupReminder from "./BackupReminder";

const StatusTag = ({ status }) => {
  const { background, color } = statusTag(status);
  return <span className="tag" style={{ background, color }}>{status}</span>;
};

export default function Dashboard() {
  const { projects, banks, cases, loading } = useApp();

  const stats = useMemo(() => {
    let totalIncome = 0, totalProfit = 0;
    const monthMap = {};
    cases.forEach(c => {
      const bank    = banks.find(b => b.id === c.bankId);
      const project = projects.find(p => p.id === c.projectId);
      const fakBank = bank ? { ...bank, agreementType: c.loanPayoutType || bank.agreementType } : bank;
      const rev = calcCaseRevenue(c, fakBank, project);
      totalIncome += rev.bankIncome;
      totalProfit += rev.profit;
      // Use disbursement month for profit grouping; case month for case count
      const hasIncome = rev.bankIncome > 0;
      const profitMonth = hasIncome
        ? (c.disbursedMonth || c.disbursedDate?.slice(0,7) || c.month)
        : c.month;
      const m = profitMonth;
      if (!m) return;
      if (!monthMap[m]) monthMap[m] = { total: 0, income: 0, profit: 0 };
      monthMap[m].total++;
      if (hasIncome) {
        monthMap[m].income += rev.bankIncome;
        monthMap[m].profit += rev.profit;
      }
    });
    const grossPending = cases.filter(c => {
      const bank = banks.find(b => b.id === c.bankId);
      if ((c.loanPayoutType || bank?.agreementType) !== "Net") return false;
      return (c.slots || []).some(s => s.disbursed && !s.bankPaid);
    }).length;
    return {
      totalCases: cases.length,
      inProcess:  cases.filter(c => c.status === "In Process").length,
      sanctioned: cases.filter(c => c.status === "Sanctioned").length,
      rejected:   cases.filter(c => c.status === "Rejected").length,
      totalIncome, totalProfit, monthMap, grossPending,
      netCases:   cases.filter(c => (c.loanPayoutType || banks.find(b=>b.id===c.bankId)?.agreementType) === "Net").length,
      grossCases: cases.filter(c => (c.loanPayoutType || banks.find(b=>b.id===c.bankId)?.agreementType) === "Gross").length,
    };
  }, [cases, banks, projects]);

  const recentCases    = [...cases].reverse().slice(0, 6);
  const activeProjects = projects.filter(p => p.status === "Active");

  if (loading) return <div style={{ textAlign:"center", padding:80, color:"var(--text-faint)" }}>Connecting to Firebase…</div>;

  return (
    <div>
      <SectionHeader title="Dashboard" sub="Live snapshot of your banking division" />
      <BackupReminder />

      <div className="grid-4" style={{ marginBottom:24 }}>
        <KpiCard label="Active Projects"      value={activeProjects.length}       icon="🏗️" color="var(--purple)" />
        <KpiCard label="Partner Banks"        value={banks.length}                icon="🏦" color="var(--accent2)" />
        <KpiCard label="Total Cases"          value={stats.totalCases}            icon="📋" color="var(--amber)" />
        <KpiCard label="Sanctioned"           value={stats.sanctioned}            icon="✅" color="var(--green)" />
        <KpiCard label="Bank Income"          value={fmtShort(stats.totalIncome)} icon="💰" color="var(--accent)" />
        <KpiCard label="Net Profit"           value={fmtShort(stats.totalProfit)} icon="📈" color="var(--green)" />
        <KpiCard label="Net — Awaiting Bank"  value={stats.grossPending}          icon="⏳" color="var(--amber)" sub="Slots disbursed, bank not paid" />
        <KpiCard label="Rejected"             value={stats.rejected}              icon="❌" color="var(--red)" />
      </div>

      {/* Model split */}
      <div style={{ display:"flex", gap:12, marginBottom:20 }}>
        <div style={{ flex:1, background:"var(--bg-card)", border:"1px solid #6366f130", borderRadius:12, padding:"14px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div><div style={{ fontFamily:"var(--font-head)", fontSize:24, fontWeight:700, color:"#818cf8" }}>{stats.netCases}</div><div style={{ fontSize:12, color:"var(--text-faint)" }}>Net Model Cases</div></div>
          <span className="tag" style={{ background:"#6366f120", color:"#818cf8" }}>Per-slot payout</span>
        </div>
        <div style={{ flex:1, background:"var(--bg-card)", border:"1px solid #00d4a130", borderRadius:12, padding:"14px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div><div style={{ fontFamily:"var(--font-head)", fontSize:24, fontWeight:700, color:"var(--accent)" }}>{stats.grossCases}</div><div style={{ fontSize:12, color:"var(--text-faint)" }}>Gross Model Cases</div></div>
          <span className="tag" style={{ background:"#00d4a120", color:"var(--accent)" }}>Lump sum payout</span>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
        <div className="card" style={{ padding:22 }}>
          <div style={{ fontWeight:600, fontSize:14, marginBottom:18 }}>Monthly Summary</div>
          {Object.keys(stats.monthMap).length === 0
            ? <div style={{ color:"var(--text-faint)", fontSize:13, textAlign:"center", padding:20 }}>No data yet.</div>
            : Object.entries(stats.monthMap).sort().map(([month, d]) => (
              <div key={month} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #111827" }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:600 }}>{month}</div>
                  <div style={{ fontSize:11, color:"var(--text-faint)" }}>{d.total} cases</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:13, color:"var(--accent)", fontWeight:700 }}>{fmtShort(d.income)}</div>
                  <div style={{ fontSize:11, color:"var(--green)", fontWeight:600 }}>{fmtShort(d.profit)} profit</div>
                </div>
              </div>
            ))
          }
        </div>

        <div className="card" style={{ padding:22 }}>
          <div style={{ fontWeight:600, fontSize:14, marginBottom:18 }}>Recent Cases</div>
          {recentCases.length === 0
            ? <div style={{ color:"var(--text-faint)", fontSize:13, textAlign:"center", padding:20 }}>No cases yet.</div>
            : recentCases.map(c => {
              const bank = banks.find(b => b.id === c.bankId);
              const fakBank = bank ? { ...bank, agreementType: c.loanPayoutType || bank.agreementType } : bank;
              const project = projects.find(p => p.id === c.projectId);
              const rev = calcCaseRevenue(c, fakBank, project);
              return (
                <div key={c.id} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #111827" }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600 }}>{c.clientName}</div>
                    <div style={{ fontSize:11, color:"var(--text-faint)" }}>{c.clientPhone||""} · {bank?.name}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:13, fontWeight:600 }}>{fmtShort(c.loanAmt)}</div>
                    <StatusTag status={c.status} />
                  </div>
                </div>
              );
            })
          }
        </div>
      </div>

      <div className="card" style={{ padding:22 }}>
        <div style={{ fontWeight:600, fontSize:14, marginBottom:16 }}>Active Mandates</div>
        {activeProjects.length === 0
          ? <div style={{ color:"var(--text-faint)", fontSize:13 }}>No active projects.</div>
          : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:12 }}>
              {activeProjects.map(p => (
                <div key={p.id} style={{ background:"var(--bg-deep)", borderRadius:10, padding:"12px 16px", border:"1px solid var(--border-lt)" }}>
                  <div style={{ fontSize:13, fontWeight:600, marginBottom:2 }}>{p.name}</div>
                  <div style={{ fontSize:11, color:"var(--text-faint)", marginBottom:6 }}>{p.location} · {p.type}</div>
                  <span className="tag" style={{ background:"#ec489920", color:"#ec4899", fontSize:10 }}>Dev Payout: {p.developerPayoutPct||0}%</span>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
}
