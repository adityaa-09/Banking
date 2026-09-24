import React, { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from "recharts";
import { useApp } from "../context/AppContext";
import { SectionHeader, KpiCard, FilterSelect, TableCard } from "../components/UI";
import { fmtShort, calcCaseRevenue } from "../utils/helpers";

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, padding:"10px 16px", fontSize:12 }}>
      <div style={{ fontWeight:700, marginBottom:6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color:p.color, marginBottom:2 }}>
          {p.name}: {typeof p.value==="number" && p.value>999 ? fmtShort(p.value) : p.value}
        </div>
      ))}
    </div>
  );
};

export default function Revenue() {
  const { cases, banks, projects } = useApp();
  const [fProject, setFProject] = useState("");
  const [fModel,   setFModel]   = useState("");

  const filtered = cases.filter(c => {
    const type = c.loanPayoutType || banks.find(b=>b.id===c.bankId)?.agreementType;
    return (!fProject || c.projectId === fProject) && (!fModel || type === fModel);
  });

  const { monthData, bankData, projectData, totals } = useMemo(() => {
    let totalBankIncome=0, totalDevPayout=0, totalProfit=0, totalVol=0;
    let totalReceivedInBank=0;
    const monthMap = {};

    filtered.forEach(c => {
      const bank    = banks.find(b=>b.id===c.bankId);
      const project = projects.find(p=>p.id===c.projectId);
      const fakBank = bank ? { ...bank, agreementType: c.loanPayoutType||bank.agreementType } : bank;
      const rev = calcCaseRevenue(c, fakBank, project);
      totalBankIncome += rev.bankIncome;
      totalDevPayout  += rev.devPayout;
      totalProfit     += rev.profit;
      if (c.disbursed) totalVol += c.disbursedAmt || 0;

      // Track amount actually received in bank account
      if (c.amountReceivedStatus === "Received" || Number(c.amountReceived) > 0) {
        totalReceivedInBank += Number(c.amountReceived) || 0;
      }

      // FIX: Group profit by DISBURSEMENT month, not case month
      // Only count months where there's actual income (disbursed)
      const hasIncome = rev.bankIncome > 0;
      const profitMonth = hasIncome ? (c.disbursedMonth || c.disbursedDate?.slice(0,7) || c.month) : c.month;
      const m = profitMonth; if (!m) return;
      if (!monthMap[m]) monthMap[m] = { month:m, Cases:0, "Bank Income":0, "Dev Payout":0, "Net Profit":0 };
      monthMap[m].Cases++;
      if (hasIncome) {
        monthMap[m]["Bank Income"] += rev.bankIncome;
        monthMap[m]["Dev Payout"]  += rev.devPayout;
        monthMap[m]["Net Profit"]  += rev.profit;
      }
    });

    const monthData = Object.values(monthMap).sort((a,b) => a.month>b.month?1:-1);

    const bankData = banks.map(bank => {
      const bCases = filtered.filter(c=>c.bankId===bank.id);
      const income = bCases.reduce((s,c) => {
        const fakBank = { ...bank, agreementType: c.loanPayoutType||bank.agreementType };
        return s + calcCaseRevenue(c, fakBank, projects.find(p=>p.id===c.projectId)).bankIncome;
      }, 0);
      return { bank, income, cases:bCases.length };
    }).filter(d=>d.cases>0).sort((a,b)=>b.income-a.income);

    const projectData = projects.map(project => {
      const pCases = filtered.filter(c=>c.projectId===project.id);
      let pIncome=0, pPayout=0, pProfit=0;
      pCases.forEach(c => {
        const bank = banks.find(b=>b.id===c.bankId);
        const fakBank = bank ? { ...bank, agreementType: c.loanPayoutType||bank.agreementType } : bank;
        const r = calcCaseRevenue(c, fakBank, project);
        pIncome += r.bankIncome; pPayout += r.devPayout; pProfit += r.profit;
      });
      return { project, income:pIncome, payout:pPayout, profit:pProfit, cases:pCases.length };
    }).filter(d=>d.cases>0).sort((a,b)=>b.profit-a.profit);

    return { monthData, bankData, projectData, totals:{ totalBankIncome, totalDevPayout, totalProfit, totalVol, totalReceivedInBank,
      netCount: filtered.filter(c=>(c.loanPayoutType||banks.find(b=>b.id===c.bankId)?.agreementType)==="Net").length,
      grossCount: filtered.filter(c=>(c.loanPayoutType||banks.find(b=>b.id===c.bankId)?.agreementType)==="Gross").length,
    }};
  }, [filtered, banks, projects]);

  return (
    <div>
      <SectionHeader
        title="Revenue Tracker"
        sub="Bank Income − Developer Payout = Net Profit (disbursed amounts only)"
        action={
          <div style={{ display:"flex", gap:10 }}>
            <FilterSelect value={fProject} onChange={setFProject} placeholder="All Projects" options={projects.map(p=>[p.id,p.name])} />
            <FilterSelect value={fModel}   onChange={setFModel}   placeholder="All Models"   options={[["Gross","Gross"],["Net","Net"]]} />
          </div>
        }
      />

      {/* Revenue flow */}
      <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:12, padding:"12px 20px", marginBottom:20, display:"flex", alignItems:"center", gap:8, fontSize:13, flexWrap:"wrap" }}>
        <span style={{ color:"var(--text-faint)" }}>💡</span>
        <span style={{ color:"var(--accent2)", fontWeight:600 }}>Bank disburses</span>
        <span style={{ color:"var(--text-dim)" }}>→</span>
        <span style={{ color:"var(--accent)", fontWeight:600 }}>Bank pays us X%</span>
        <span style={{ color:"var(--text-dim)" }}>→</span>
        <span style={{ color:"var(--green)", fontWeight:600 }}>Received in A/C</span>
        <span style={{ color:"var(--text-dim)" }}>→</span>
        <span style={{ color:"#f87171", fontWeight:600 }}>We pay developer Y%</span>
        <span style={{ color:"var(--text-dim)" }}>→</span>
        <span style={{ color:"var(--green)", fontWeight:700 }}>Profit = X − Y</span>
        <span style={{ marginLeft:"auto", display:"flex", gap:10 }}>
          <span className="tag" style={{ background:"#6366f120", color:"#818cf8" }}>Net: {totals.netCount}</span>
          <span className="tag" style={{ background:"#00d4a120", color:"var(--accent)" }}>Gross: {totals.grossCount}</span>
        </span>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:16, marginBottom:24 }}>
        <KpiCard label="Disbursed Volume" value={fmtShort(totals.totalVol)}        icon="🏦" color="var(--accent2)" />
        <KpiCard label="Bank Income (Expected)" value={fmtShort(totals.totalBankIncome)} icon="💰" color="var(--accent)"  />
        <KpiCard
          label="Received in Bank"
          value={fmtShort(totals.totalReceivedInBank)}
          icon="💳"
          color="#10b981"
          sub={`${totals.totalBankIncome > 0 ? Math.round((totals.totalReceivedInBank / totals.totalBankIncome) * 100) : 0}% of Bank Income collected`}
        />
        <KpiCard label="Developer Payout" value={fmtShort(totals.totalDevPayout)}  icon="🏗️" color="#f87171"        />
        <KpiCard label="Net Profit"       value={fmtShort(totals.totalProfit)}      icon="📈" color="var(--green)"   />
      </div>

      {/* Charts */}
      <div style={{ display:"grid", gridTemplateColumns:"3fr 2fr", gap:20, marginBottom:20 }}>
        <div className="card" style={{ padding:22 }}>
          <div style={{ fontWeight:600, fontSize:14, marginBottom:20 }}>Monthly P&L</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="month" tick={{ fill:"#64748b", fontSize:11 }} />
              <YAxis tickFormatter={v=>fmtShort(v)} tick={{ fill:"#64748b", fontSize:10 }} />
              <Tooltip content={<Tip />} />
              <Legend wrapperStyle={{ fontSize:12, color:"#94a3b8" }} />
              <Bar dataKey="Bank Income" fill="#00d4a1" radius={[4,4,0,0]} />
              <Bar dataKey="Dev Payout"  fill="#f87171" radius={[4,4,0,0]} />
              <Bar dataKey="Net Profit"  fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card" style={{ padding:22 }}>
          <div style={{ fontWeight:600, fontSize:14, marginBottom:20 }}>Cases per Month</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="month" tick={{ fill:"#64748b", fontSize:11 }} />
              <YAxis tick={{ fill:"#64748b", fontSize:11 }} />
              <Tooltip content={<Tip />} />
              <Line type="monotone" dataKey="Cases" stroke="#f59e0b" strokeWidth={2} dot={{ r:4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly table */}
      <div className="card" style={{ padding:22, marginBottom:20 }}>
        <div style={{ fontWeight:600, fontSize:14, marginBottom:14 }}>Monthly Breakdown</div>
        <TableCard>
          <table>
            <thead><tr><th>Month</th><th>Cases</th><th>Bank Income</th><th>Dev Payout</th><th>Net Profit</th></tr></thead>
            <tbody>
              {monthData.map(d => (
                <tr key={d.month}>
                  <td style={{ fontWeight:600 }}>{d.month}</td>
                  <td>{d.Cases}</td>
                  <td style={{ color:"var(--accent)", fontWeight:600 }}>{fmtShort(d["Bank Income"])}</td>
                  <td style={{ color:"#f87171", fontWeight:600 }}>−{fmtShort(d["Dev Payout"])}</td>
                  <td style={{ color:d["Net Profit"]>=0?"var(--green)":"#f87171", fontWeight:700 }}>{fmtShort(d["Net Profit"])}</td>
                </tr>
              ))}
              {monthData.length > 0 && (
                <tr style={{ borderTop:"2px solid var(--border)", background:"#0a0f1e" }}>
                  <td style={{ fontWeight:700 }}>TOTAL</td>
                  <td style={{ fontWeight:700 }}>{filtered.length}</td>
                  <td style={{ color:"var(--accent)", fontWeight:700 }}>{fmtShort(totals.totalBankIncome)}</td>
                  <td style={{ color:"#f87171", fontWeight:700 }}>−{fmtShort(totals.totalDevPayout)}</td>
                  <td style={{ color:"var(--green)", fontWeight:700, fontSize:15 }}>{fmtShort(totals.totalProfit)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </TableCard>
      </div>

      {/* Project P&L */}
      {projectData.length > 0 && (
        <div className="card" style={{ padding:22, marginBottom:20 }}>
          <div style={{ fontWeight:600, fontSize:14, marginBottom:14 }}>Project-wise P&L</div>
          <TableCard>
            <table>
              <thead><tr><th>Project</th><th>Developer</th><th>Dev %</th><th>Cases</th><th>Bank Income</th><th>Dev Payout</th><th>Net Profit</th></tr></thead>
              <tbody>
                {projectData.map(d => (
                  <tr key={d.project.id}>
                    <td><div style={{ fontWeight:600 }}>{d.project.name}</div><div style={{ fontSize:11, color:"var(--text-faint)" }}>{d.project.location}</div></td>
                    <td style={{ color:"var(--text-muted)" }}>{d.project.developer}</td>
                    <td><span className="tag" style={{ background:"#ec489920", color:"#ec4899" }}>{d.project.developerPayoutPct||0}%</span></td>
                    <td>{d.cases}</td>
                    <td style={{ color:"var(--accent)", fontWeight:600 }}>{fmtShort(d.income)}</td>
                    <td style={{ color:"#f87171", fontWeight:600 }}>−{fmtShort(d.payout)}</td>
                    <td style={{ color:d.profit>=0?"var(--green)":"#f87171", fontWeight:700 }}>{fmtShort(d.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        </div>
      )}

      {/* Bank leaderboard */}
      <div className="card" style={{ padding:22 }}>
        <div style={{ fontWeight:600, fontSize:14, marginBottom:14 }}>Bank-wise Income</div>
        <TableCard>
          <table>
            <thead><tr><th>Rank</th><th>Bank</th><th>Model</th><th>Commission %</th><th>Cases</th><th>Income Earned</th></tr></thead>
            <tbody>
              {bankData.map((d,i) => (
                <tr key={d.bank.id}>
                  <td><span style={{ fontFamily:"var(--font-head)", fontWeight:700, fontSize:18, color:["var(--accent)","var(--purple)","var(--amber)","var(--accent2)"][i]||"var(--text-faint)" }}>#{i+1}</span></td>
                  <td><div style={{ display:"flex", alignItems:"center", gap:8 }}><span style={{ fontSize:18 }}>{d.bank.logo}</span><span style={{ fontWeight:600 }}>{d.bank.name}</span></div></td>
                  <td><span className="tag" style={{ background:d.bank.agreementType==="Net"?"#6366f120":"#00d4a120", color:d.bank.agreementType==="Net"?"#818cf8":"var(--accent)" }}>{d.bank.agreementType}</span></td>
                  <td style={{ fontWeight:700 }}>{d.bank.agreementPct}%</td>
                  <td>{d.cases}</td>
                  <td style={{ color:"var(--accent)", fontWeight:700, fontSize:15 }}>{fmtShort(d.income)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      </div>
    </div>
  );
}
