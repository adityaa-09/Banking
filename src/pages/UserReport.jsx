import React, { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { SectionHeader, KpiCard, FilterSelect, TableCard } from "../components/UI";
import { fmtShort, calcCaseRevenue, statusTag } from "../utils/helpers";
import { Users, FileText, Coins, TrendingUp, Clock } from "lucide-react";

export default function UserReport() {
  const { cases, banks, projects, users } = useApp();
  const [selectedUser, setSelectedUser] = useState("");

  const userStats = useMemo(() => {
    return users.map(u => {
      const uCases = cases.filter(c => c.createdBy === u.id);
      let income = 0, profit = 0;
      uCases.forEach(c => {
        const bank    = banks.find(b => b.id === c.bankId);
        const project = projects.find(p => p.id === c.projectId);
        const fakBank = bank ? { ...bank, agreementType: c.loanPayoutType || bank.agreementType } : bank;
        const rev = calcCaseRevenue(c, fakBank, project);
        income += rev.bankIncome; profit += rev.profit;
      });
      const statuses = {};
      uCases.forEach(c => { statuses[c.status] = (statuses[c.status]||0)+1; });
      return { user: u, caseCount: uCases.length, income, profit, statuses, cases: uCases };
    }).filter(u => u.caseCount > 0).sort((a,b) => b.caseCount - a.caseCount);
  }, [cases, banks, projects, users]);

  const selectedStats = selectedUser ? userStats.find(u => u.user.id === selectedUser) : null;
  const selectedCases = selectedStats?.cases || [];

  const ST = ({ status }) => {
    const { background, color } = statusTag(status);
    return <span className="tag" style={{ background, color }}>{status}</span>;
  };

  return (
    <div>
      <SectionHeader
        title="User Reports"
        sub="Track case ownership and performance per team member"
        action={
          <FilterSelect value={selectedUser} onChange={setSelectedUser} placeholder="All Users"
            options={userStats.map(u => [u.user.id, u.user.name])} />
        }
      />

      {!selectedUser && (
        <>
          <div className="grid-4" style={{ marginBottom:24 }}>
            <KpiCard label="Team Members" value={userStats.length}                                 icon={<Users size={18} />}      color="var(--accent2)" />
            <KpiCard label="Total Cases"  value={cases.length}                                     icon={<FileText size={18} />}   color="var(--amber)"   />
            <KpiCard label="Total Income" value={fmtShort(userStats.reduce((s,u)=>s+u.income,0))} icon={<Coins size={18} />}      color="var(--accent)"  />
            <KpiCard label="Total Profit" value={fmtShort(userStats.reduce((s,u)=>s+u.profit,0))} icon={<TrendingUp size={18} />} color="var(--green)"   />
          </div>
          <TableCard>
            <table>
              <thead>
                <tr><th>Team Member</th><th>Role</th><th>Cases</th><th>In Process</th><th>Sanctioned</th><th>Rejected</th><th>Bank Income</th><th>Net Profit</th><th></th></tr>
              </thead>
              <tbody>
                {userStats.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign:"center", color:"var(--text-faint)", padding:40 }}>No cases with user tracking yet.</td></tr>
                ) : userStats.map(u => (
                  <tr key={u.user.id} style={{ cursor:"pointer" }} onClick={()=>setSelectedUser(u.user.id)}>
                    <td>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#00d4a1,#0088ff)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#060c18", flexShrink:0 }}>
                          {u.user.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight:600 }}>{u.user.name}</div>
                          <div style={{ fontSize:11, color:"var(--text-faint)" }}>{u.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="tag" style={{ background:u.user.role==="admin"?"#ef444420":u.user.role==="executive"?"#00d4a120":"#6366f120", color:u.user.role==="admin"?"#f87171":u.user.role==="executive"?"var(--accent)":"#818cf8" }}>{u.user.role}</span></td>
                    <td><span style={{ fontFamily:"var(--font-head)", fontSize:20, fontWeight:700, color:"var(--accent2)" }}>{u.caseCount}</span></td>
                    <td style={{ color:"var(--amber)" }}>{u.statuses["In Process"]||0}</td>
                    <td style={{ color:"var(--green)" }}>{u.statuses["Sanctioned"]||0}</td>
                    <td style={{ color:"#f87171" }}>{u.statuses["Rejected"]||0}</td>
                    <td style={{ color:"var(--accent)", fontWeight:600 }}>{fmtShort(u.income)}</td>
                    <td style={{ color:"var(--green)", fontWeight:700 }}>{fmtShort(u.profit)}</td>
                    <td style={{ color:"var(--text-faint)" }}>→</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        </>
      )}

      {selectedUser && selectedStats && (
        <>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
            <button onClick={()=>setSelectedUser("")} style={{ background:"var(--border)", border:"none", color:"var(--text)", borderRadius:8, padding:"7px 14px", cursor:"pointer", fontFamily:"var(--font-body)", fontSize:13 }}>← Back</button>
            <div style={{ width:44, height:44, borderRadius:"50%", background:"linear-gradient(135deg,#00d4a1,#0088ff)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:700, color:"#060c18" }}>
              {selectedStats.user.name[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontFamily:"var(--font-head)", fontSize:20, fontWeight:700 }}>{selectedStats.user.name}</div>
              <div style={{ fontSize:12, color:"var(--text-faint)" }}>{selectedStats.user.email} · {selectedStats.user.role}</div>
            </div>
          </div>
          <div className="grid-4" style={{ marginBottom:20 }}>
            <KpiCard label="Total Cases"  value={selectedStats.caseCount}                icon={<FileText size={18} />}   color="var(--accent2)" />
            <KpiCard label="In Process"   value={selectedStats.statuses["In Process"]||0} icon={<Clock size={18} />}      color="var(--amber)"   />
            <KpiCard label="Bank Income"  value={fmtShort(selectedStats.income)}          icon={<Coins size={18} />}      color="var(--accent)"  />
            <KpiCard label="Net Profit"   value={fmtShort(selectedStats.profit)}          icon={<TrendingUp size={18} />} color="var(--green)"   />
          </div>
          <TableCard>
            <table>
              <thead><tr><th>Client</th><th>Phone</th><th>Project</th><th>Bank</th><th>Loan Amt</th><th>Month</th><th>Status</th><th>Income</th></tr></thead>
              <tbody>
                {selectedCases.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign:"center", color:"var(--text-faint)", padding:30 }}>No cases.</td></tr>
                ) : selectedCases.map(c => {
                  const bank    = banks.find(b=>b.id===c.bankId);
                  const project = projects.find(p=>p.id===c.projectId);
                  const fakBank = bank ? { ...bank, agreementType:c.loanPayoutType||bank.agreementType } : bank;
                  const rev = calcCaseRevenue(c, fakBank, project);
                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight:600 }}>{c.clientName}</td>
                      <td style={{ fontSize:12, color:"var(--text-muted)" }}>{c.clientPhone||"—"}</td>
                      <td style={{ fontSize:12 }}>{project?.name||"—"}</td>
                      <td style={{ fontSize:12 }}>{bank?.name||"—"}</td>
                      <td style={{ color:"var(--accent2)", fontWeight:600 }}>{fmtShort(c.loanAmt)}</td>
                      <td style={{ color:"var(--text-muted)", fontSize:12 }}>{c.month}</td>
                      <td><ST status={c.status} /></td>
                      <td style={{ color:"var(--accent)", fontWeight:600 }}>{fmtShort(rev.bankIncome)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableCard>
        </>
      )}
    </div>
  );
}
