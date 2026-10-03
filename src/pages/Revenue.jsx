import React, { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from "recharts";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import {
  SectionHeader, KpiCard, FilterSelect, TableCard, Btn,
  Modal, FormField, DatePicker, EmptyState,
} from "../components/UI";
import { fmtShort, fmtDate, calcCaseRevenue } from "../utils/helpers";
import {
  CreditCard,
  BarChart3,
  Landmark,
  Coins,
  Building2,
  TrendingUp,
  Clock,
  Sparkles,
  Check,
} from "lucide-react";

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 16px", fontSize: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: {typeof p.value === "number" && p.value > 999 ? fmtShort(p.value) : p.value}
        </div>
      ))}
    </div>
  );
};

export default function Revenue() {
  const { cases, banks, projects, saveCase, writeLog } = useApp();
  const { user, canEdit } = useAuth();

  const [activeTab, setActiveTab] = useState("receipts"); // "receipts" | "analysis"
  const [fProject, setFProject] = useState("");
  const [fBank, setFBank] = useState("");
  const [fModel, setFModel] = useState("");
  const [fStatus, setFStatus] = useState(""); // All, Received, Partially Received, Pending
  const [search, setSearch] = useState("");

  // Quick edit modal for Bank Receipt
  const [editReceiptCase, setEditReceiptCase] = useState(null);
  const [receiptForm, setReceiptForm] = useState({
    amountReceivedStatus: "Received",
    amountReceived: "",
    amountReceivedDate: "",
    amountReceivedBy: "",
    utrRef: "",
    accountsRemarks: "",
  });
  const [savingReceipt, setSavingReceipt] = useState(false);

  // Filter cases based on search & filter dropdowns
  const filtered = useMemo(() => {
    return cases.filter(c => {
      const type = c.loanPayoutType || banks.find(b => b.id === c.bankId)?.agreementType;
      const status = c.amountReceivedStatus || (Number(c.amountReceived) > 0 ? "Received" : "Pending");

      if (fProject && c.projectId !== fProject) return false;
      if (fBank && c.bankId !== fBank) return false;
      if (fModel && type !== fModel) return false;
      if (fStatus && status !== fStatus) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const client = (c.clientName || "").toLowerCase();
        const phone = (c.clientPhone || "").toLowerCase();
        const utr = (c.utrRef || "").toLowerCase();
        const bName = (banks.find(b => b.id === c.bankId)?.name || "").toLowerCase();
        const pName = (projects.find(p => p.id === c.projectId)?.name || "").toLowerCase();
        if (!client.includes(q) && !phone.includes(q) && !utr.includes(q) && !bName.includes(q) && !pName.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [cases, banks, projects, fProject, fBank, fModel, fStatus, search]);

  // Aggregated metrics & data structures
  const { monthData, bankData, projectData, totals, receiptCases } = useMemo(() => {
    let totalBankIncome = 0, totalDevPayout = 0, totalProfit = 0, totalVol = 0;
    let totalReceivedInBank = 0;
    const monthMap = {};

    const enrichedCases = filtered.map(c => {
      const bank = banks.find(b => b.id === c.bankId);
      const project = projects.find(p => p.id === c.projectId);
      const fakBank = bank ? { ...bank, agreementType: c.loanPayoutType || bank.agreementType } : bank;
      const rev = calcCaseRevenue(c, fakBank, project);

      const amtRec = Number(c.amountReceived) || 0;
      const recStatus = c.amountReceivedStatus || (amtRec > 0 ? "Received" : "Pending");
      const pendingAmt = Math.max(0, rev.bankIncome - amtRec);

      totalBankIncome += rev.bankIncome;
      totalDevPayout += rev.devPayout;
      totalProfit += rev.profit;
      if (c.disbursed) totalVol += (c.disbursedAmt || c.loanAmt || 0);

      if (recStatus === "Received" || amtRec > 0) {
        totalReceivedInBank += amtRec;
      }

      // Group by disbursement month
      const hasIncome = rev.bankIncome > 0;
      const profitMonth = hasIncome ? (c.disbursedMonth || c.disbursedDate?.slice(0, 7) || c.month) : c.month;
      const m = profitMonth;
      if (m) {
        if (!monthMap[m]) {
          monthMap[m] = {
            month: m,
            Cases: 0,
            "Bank Income": 0,
            "Received in Bank": 0,
            "Pending": 0,
            "Dev Payout": 0,
            "Net Profit": 0,
          };
        }
        monthMap[m].Cases++;
        monthMap[m]["Received in Bank"] += amtRec;
        if (hasIncome) {
          monthMap[m]["Bank Income"] += rev.bankIncome;
          monthMap[m]["Pending"] += pendingAmt;
          monthMap[m]["Dev Payout"] += rev.devPayout;
          monthMap[m]["Net Profit"] += rev.profit;
        }
      }

      return {
        ...c,
        bank,
        project,
        expectedIncome: rev.bankIncome,
        devPayout: rev.devPayout,
        profit: rev.profit,
        amtRec,
        recStatus,
        pendingAmt,
      };
    });

    const monthData = Object.values(monthMap).sort((a, b) => (a.month > b.month ? 1 : -1));

    // Bank-wise summary
    const bankData = banks.map(bank => {
      const bCases = enrichedCases.filter(c => c.bankId === bank.id);
      let income = 0, received = 0, pending = 0;
      bCases.forEach(c => {
        income += c.expectedIncome;
        received += c.amtRec;
        pending += c.pendingAmt;
      });
      const collRate = income > 0 ? Math.round((received / income) * 100) : (received > 0 ? 100 : 0);
      return { bank, income, received, pending, collRate, cases: bCases.length };
    }).filter(d => d.cases > 0).sort((a, b) => b.received - a.received);

    // Project-wise summary
    const projectData = projects.map(project => {
      const pCases = enrichedCases.filter(c => c.projectId === project.id);
      let pIncome = 0, pPayout = 0, pProfit = 0, pReceived = 0, pPending = 0;
      pCases.forEach(c => {
        pIncome += c.expectedIncome;
        pPayout += c.devPayout;
        pProfit += c.profit;
        pReceived += c.amtRec;
        pPending += c.pendingAmt;
      });
      return {
        project,
        income: pIncome,
        payout: pPayout,
        profit: pProfit,
        received: pReceived,
        pending: pPending,
        cases: pCases.length,
      };
    }).filter(d => d.cases > 0).sort((a, b) => b.profit - a.profit);

    const totalPendingFromBank = Math.max(0, totalBankIncome - totalReceivedInBank);
    const collectionRate = totalBankIncome > 0 ? Math.round((totalReceivedInBank / totalBankIncome) * 100) : 0;

    return {
      monthData,
      bankData,
      projectData,
      receiptCases: enrichedCases,
      totals: {
        totalBankIncome,
        totalDevPayout,
        totalProfit,
        totalVol,
        totalReceivedInBank,
        totalPendingFromBank,
        collectionRate,
        receivedCount: enrichedCases.filter(c => c.recStatus === "Received").length,
        partialCount: enrichedCases.filter(c => c.recStatus === "Partially Received").length,
        pendingCount: enrichedCases.filter(c => c.recStatus === "Pending").length,
        netCount: filtered.filter(c => (c.loanPayoutType || banks.find(b => b.id === c.bankId)?.agreementType) === "Net").length,
        grossCount: filtered.filter(c => (c.loanPayoutType || banks.find(b => b.id === c.bankId)?.agreementType) === "Gross").length,
      },
    };
  }, [filtered, banks, projects]);

  // Open quick update receipt modal
  const openReceiptModal = (c) => {
    setEditReceiptCase(c);
    setReceiptForm({
      amountReceivedStatus: c.amountReceivedStatus || (Number(c.amountReceived) > 0 ? "Received" : "Pending"),
      amountReceived: c.amountReceived !== undefined && c.amountReceived !== "" ? c.amountReceived : (c.expectedIncome ? Math.round(c.expectedIncome) : ""),
      amountReceivedDate: c.amountReceivedDate || new Date().toISOString().split("T")[0],
      amountReceivedBy: c.amountReceivedBy || user?.name || "",
      utrRef: c.utrRef || "",
      accountsRemarks: c.accountsRemarks || "",
    });
  };

  const handleSaveReceipt = async () => {
    if (!editReceiptCase) return;
    setSavingReceipt(true);
    try {
      const updated = {
        ...editReceiptCase,
        amountReceivedStatus: receiptForm.amountReceivedStatus || "Pending",
        amountReceived: Number(receiptForm.amountReceived) || 0,
        amountReceivedDate: receiptForm.amountReceivedDate || "",
        amountReceivedBy: receiptForm.amountReceivedBy || "",
        utrRef: receiptForm.utrRef || "",
        accountsRemarks: receiptForm.accountsRemarks || "",
      };
      await saveCase(updated, editReceiptCase.id);

      if (writeLog) {
        try {
          await writeLog({
            caseId: editReceiptCase.id,
            action: `updated Accounts receipt (${updated.amountReceivedStatus}: ₹${updated.amountReceived} received by ${updated.amountReceivedBy})`,
            userId: user?.id,
            userName: user?.name,
          });
        } catch { }
      }

      setEditReceiptCase(null);
    } catch (err) {
      alert("Failed to save receipt: " + err.message);
    } finally {
      setSavingReceipt(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Revenue & Bank Receipts Tracker"
        sub="Track actual amounts received in bank account alongside projected bank income and P&L"
        action={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Search client, UTR, bank…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "8px 14px",
                color: "var(--text)",
                fontSize: 13,
                width: 190,
              }}
            />
            <FilterSelect value={fProject} onChange={setFProject} placeholder="All Projects" options={projects.map(p => [p.id, p.name])} />
            <FilterSelect value={fBank} onChange={setFBank} placeholder="All Banks" options={banks.map(b => [b.id, b.name])} />
            <FilterSelect value={fModel} onChange={setFModel} placeholder="All Models" options={[["Gross", "Gross"], ["Net", "Net"]]} />
            <FilterSelect
              value={fStatus}
              onChange={setFStatus}
              placeholder="All Statuses"
              options={[
                ["Received", "Received in Bank"],
                ["Partially Received", "Partially Received"],
                ["Pending", "Pending from Bank"],
              ]}
            />
          </div>
        }
      />

      {/* Primary Navigation Tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab("receipts")}
          style={{
            flex: 1,
            padding: "14px 20px",
            borderRadius: 12,
            border: activeTab === "receipts" ? "1px solid var(--accent)" : "1px solid var(--border)",
            background: activeTab === "receipts" ? "linear-gradient(135deg, rgba(0, 212, 161, 0.12), rgba(0, 136, 255, 0.08))" : "var(--bg-card)",
            cursor: "pointer",
            textAlign: "left",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            transition: "all 0.2s",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: activeTab === "receipts" ? "var(--accent)" : "var(--text-muted)", display: "flex", alignItems: "center" }}>
                <CreditCard size={18} />
              </span>
              <span style={{ fontWeight: 700, fontSize: 15, color: activeTab === "receipts" ? "var(--accent)" : "var(--text)" }}>
                Bank Receipts & Collections
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 4 }}>
              Track what has been credited to our bank account per case
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#10b981" }}>{fmtShort(totals.totalReceivedInBank)}</div>
            <div style={{ fontSize: 11, color: "var(--text-dim)" }}>
              {totals.receivedCount} received / {totals.pendingCount} pending
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("analysis")}
          style={{
            flex: 1,
            padding: "14px 20px",
            borderRadius: 12,
            border: activeTab === "analysis" ? "1px solid #818cf8" : "1px solid var(--border)",
            background: activeTab === "analysis" ? "linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.08))" : "var(--bg-card)",
            cursor: "pointer",
            textAlign: "left",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            transition: "all 0.2s",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: activeTab === "analysis" ? "#818cf8" : "var(--text-muted)", display: "flex", alignItems: "center" }}>
                <BarChart3 size={18} />
              </span>
              <span style={{ fontWeight: 700, fontSize: 15, color: activeTab === "analysis" ? "#818cf8" : "var(--text)" }}>
                Revenue & P&L Analysis
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 4 }}>
              Monthly performance, bank commission leaderboard, and project P&L
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: "var(--green)" }}>{fmtShort(totals.totalProfit)}</div>
            <div style={{ fontSize: 11, color: "var(--text-dim)" }}>Net Profit</div>
          </div>
        </button>
      </div>

      {/* High-level Flow Banner — On-Paper Revenue Flow */}
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "12px 20px",
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 13,
        flexWrap: "wrap",
      }}>
        <span style={{ color: "var(--amber)", display: "flex", alignItems: "center" }}><Sparkles size={16} /></span>
        <span style={{ color: "var(--accent2)", fontWeight: 600 }}>Bank disburses</span>
        <span style={{ color: "var(--text-dim)" }}>→</span>
        <span style={{ color: "var(--accent)", fontWeight: 600 }}>Bank pays commission</span>
        <span style={{ color: "var(--text-dim)" }}>→</span>
        <span style={{ color: "#f87171", fontWeight: 600 }}>We pay developer Y% (on loan amount)</span>
        <span style={{ color: "var(--text-dim)" }}>→</span>
        <span style={{ color: "var(--green)", fontWeight: 700 }}>Net Profit = Bank Income − Dev Payout</span>
        <span style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          <span className="tag" style={{ background: "#6366f120", color: "#818cf8" }}>Net: {totals.netCount}</span>
          <span className="tag" style={{ background: "#00d4a120", color: "var(--accent)" }}>Gross: {totals.grossCount}</span>
        </span>
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <KpiCard
          label="Disbursed Volume"
          value={fmtShort(totals.totalVol)}
          icon={<Landmark size={18} />}
          color="var(--accent2)"
          sub="Total loan amount disbursed"
        />
        <KpiCard
          label="Bank Income"
          value={fmtShort(totals.totalBankIncome)}
          icon={<Coins size={18} />}
          color="var(--accent)"
          sub="Agreed total bank commission"
        />
        <KpiCard
          label="Developer Payout"
          value={fmtShort(totals.totalDevPayout)}
          icon={<Building2 size={18} />}
          color="#f87171"
          sub="Gross: total loan % | Net: disbursed %"
        />
        <KpiCard
          label="Net Profit"
          value={fmtShort(totals.totalProfit)}
          icon={<TrendingUp size={18} />}
          color="var(--green)"
          sub="Bank income − dev payout"
        />
        <KpiCard
          label="Received in Bank"
          value={fmtShort(totals.totalReceivedInBank)}
          icon={<CreditCard size={18} />}
          color="#10b981"
          sub={`${totals.collectionRate}% received (${totals.receivedCount} cases)`}
        />
        <KpiCard
          label="Balance to Receive"
          value={fmtShort(totals.totalPendingFromBank)}
          icon={<Clock size={18} />}
          color="#f59e0b"
          sub={`${totals.pendingCount} cases with balance pending`}
        />
      </div>

      {/* ──────────────── TAB 1: BANK RECEIPTS & COLLECTIONS ──────────────── */}
      {activeTab === "receipts" && (
        <div>
          {/* Status Quick Filters */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={() => setFStatus("")}
              style={{
                background: fStatus === "" ? "var(--border)" : "var(--bg-card)",
                color: fStatus === "" ? "var(--text)" : "var(--text-muted)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 12,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              All Cases ({receiptCases.length})
            </button>
            <button
              onClick={() => setFStatus("Received")}
              style={{
                background: fStatus === "Received" ? "#10b98125" : "var(--bg-card)",
                color: fStatus === "Received" ? "#34d399" : "var(--text-muted)",
                border: fStatus === "Received" ? "1px solid #10b98160" : "1px solid var(--border)",
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 12,
                cursor: "pointer",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
              Received in Bank ({totals.receivedCount})
            </button>
            <button
              onClick={() => setFStatus("Partially Received")}
              style={{
                background: fStatus === "Partially Received" ? "#0088ff25" : "var(--bg-card)",
                color: fStatus === "Partially Received" ? "#60a5fa" : "var(--text-muted)",
                border: fStatus === "Partially Received" ? "1px solid #0088ff60" : "1px solid var(--border)",
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 12,
                cursor: "pointer",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#0088ff" }} />
              Partially Received ({totals.partialCount})
            </button>
            <button
              onClick={() => setFStatus("Pending")}
              style={{
                background: fStatus === "Pending" ? "#f59e0b25" : "var(--bg-card)",
                color: fStatus === "Pending" ? "#fbbf24" : "var(--text-muted)",
                border: fStatus === "Pending" ? "1px solid #f59e0b60" : "1px solid var(--border)",
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 12,
                cursor: "pointer",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b" }} />
              Pending Collection ({totals.pendingCount})
            </button>
          </div>

          {/* Cases Receipt Table */}
          <div className="card" style={{ padding: 22, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Bank Receipts Register</div>
                <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>
                  Direct tracking of all commission payments received into our bank account
                </div>
              </div>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Showing <strong>{receiptCases.length}</strong> cases
              </span>
            </div>

            {receiptCases.length === 0 ? (
              <EmptyState message="No cases match the selected filters." />
            ) : (
              <TableCard>
                <table>
                  <thead>
                    <tr>
                      <th>Client / Case</th>
                      <th>Project & Bank</th>
                      <th>Payout Model</th>
                      <th>Disbursed Amt</th>
                      <th>Expected Bank Income</th>
                      <th style={{ color: "#10b981" }}>Amount Received in Bank</th>
                      <th>Pending Balance</th>
                      <th>Payment Status</th>
                      <th>Received Date</th>
                      <th>Received By</th>
                      <th>Bank Ref / UTR</th>
                      {canEdit && <th>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {receiptCases.map(c => {
                      const isFullyRec = c.recStatus === "Received" || (c.expectedIncome > 0 && c.amtRec >= c.expectedIncome);
                      const isPartial = c.recStatus === "Partially Received" || (c.amtRec > 0 && c.amtRec < c.expectedIncome);

                      return (
                        <tr key={c.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{c.clientName || "Unnamed"}</div>
                            <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{c.clientPhone || c.caseNo || "—"}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 500 }}>{c.project?.name || "—"}</div>
                            <div style={{ fontSize: 11, color: "var(--accent2)" }}>{c.bank?.name || "—"}</div>
                          </td>
                          <td>
                            <span className="tag" style={{
                              background: (c.loanPayoutType || c.bank?.agreementType) === "Net" ? "#6366f120" : "#00d4a120",
                              color: (c.loanPayoutType || c.bank?.agreementType) === "Net" ? "#818cf8" : "var(--accent)",
                            }}>
                              {c.loanPayoutType || c.bank?.agreementType || "Gross"}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {fmtShort(c.disbursedAmt || (c.disbursed ? c.loanAmt : 0))}
                          </td>
                          <td style={{ color: "var(--accent)", fontWeight: 600 }}>
                            {fmtShort(c.expectedIncome)}
                          </td>
                          <td>
                            <span style={{
                              fontWeight: 700,
                              fontSize: 14,
                              color: c.amtRec > 0 ? "#10b981" : "var(--text-faint)",
                            }}>
                              {c.amtRec > 0 ? `₹${c.amtRec.toLocaleString("en-IN")}` : "₹0"}
                            </span>
                          </td>
                          <td style={{
                            color: c.pendingAmt > 0 ? "#fbbf24" : "var(--green)",
                            fontWeight: c.pendingAmt > 0 ? 600 : 400,
                          }}>
                            {c.pendingAmt > 0 ? fmtShort(c.pendingAmt) : "₹0"}
                          </td>
                          <td>
                            <span className="tag" style={{
                              background: isFullyRec ? "#10b98122" : isPartial ? "#0088ff22" : "#f59e0b22",
                              color: isFullyRec ? "#34d399" : isPartial ? "#60a5fa" : "#fbbf24",
                              fontWeight: 600,
                            }}>
                              {isFullyRec ? (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                                  <Check size={11} /> Received
                                </span>
                              ) : isPartial ? "Partially Received" : "Pending"}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, color: c.amountReceivedDate ? "var(--text)" : "var(--text-dim)" }}>
                            {c.amountReceivedDate ? fmtDate(c.amountReceivedDate) : "—"}
                          </td>
                          <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                            {c.amountReceivedBy || "—"}
                          </td>
                          <td style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-muted)" }}>
                            {c.utrRef || "—"}
                          </td>
                          {canEdit && (
                            <td>
                              <Btn
                                size="sm"
                                variant={c.amtRec > 0 ? "ghost" : "primary"}
                                onClick={() => openReceiptModal(c)}
                                style={{ fontSize: 11, padding: "4px 10px" }}
                              >
                                {c.amtRec > 0 ? "Edit" : "+ Record"}
                              </Btn>
                            </td>
                          )}
                        </tr>
                      );
                    })}

                    {receiptCases.length > 0 && (
                      <tr style={{ borderTop: "2px solid var(--border)", background: "#0a0f1e" }}>
                        <td style={{ fontWeight: 700 }} colSpan={3}>TOTAL ({receiptCases.length} cases)</td>
                        <td style={{ fontWeight: 700 }}>{fmtShort(totals.totalVol)}</td>
                        <td style={{ color: "var(--accent)", fontWeight: 700 }}>{fmtShort(totals.totalBankIncome)}</td>
                        <td style={{ color: "#10b981", fontWeight: 800, fontSize: 15 }}>
                          ₹{totals.totalReceivedInBank.toLocaleString("en-IN")}
                        </td>
                        <td style={{ color: "#fbbf24", fontWeight: 700 }}>{fmtShort(totals.totalPendingFromBank)}</td>
                        <td style={{ fontWeight: 700 }} colSpan={canEdit ? 5 : 4}>
                          <span style={{ color: "#34d399" }}>{totals.collectionRate}% collected</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </TableCard>
            )}
          </div>
        </div>
      )}

      {/* ──────────────── TAB 2: REVENUE & P&L ANALYSIS ──────────────── */}
      {activeTab === "analysis" && (
        <div>
          {/* Charts */}
          <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20, marginBottom: 20 }}>
            <div className="card" style={{ padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Monthly Income vs Actual Bank Receipts & P&L</div>
                <div style={{ fontSize: 11, color: "var(--text-faint)" }}>Disbursement month basis</div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} />
                  <YAxis tickFormatter={v => fmtShort(v)} tick={{ fill: "#64748b", fontSize: 10 }} />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                  <Bar dataKey="Bank Income" fill="#00d4a1" radius={[4, 4, 0, 0]} name="Bank Income (Exp)" />
                  <Bar dataKey="Received in Bank" fill="#10b981" radius={[4, 4, 0, 0]} name="Received in Bank" />
                  <Bar dataKey="Dev Payout" fill="#f87171" radius={[4, 4, 0, 0]} name="Dev Payout" />
                  <Bar dataKey="Net Profit" fill="#818cf8" radius={[4, 4, 0, 0]} name="Net Profit" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card" style={{ padding: 22 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 20 }}>Cases per Month</div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={monthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                  <Tooltip content={<Tip />} />
                  <Line type="monotone" dataKey="Cases" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Breakdown table */}
          <div className="card" style={{ padding: 22, marginBottom: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Monthly Breakdown (Expected vs Bank Received)</div>
            <TableCard>
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Cases</th>
                    <th>Bank Income (Expected)</th>
                    <th style={{ color: "#10b981" }}>Received in Bank</th>
                    <th>Pending Collection</th>
                    <th>Dev Payout</th>
                    <th>Net Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {monthData.map(d => (
                    <tr key={d.month}>
                      <td style={{ fontWeight: 600 }}>{d.month}</td>
                      <td>{d.Cases}</td>
                      <td style={{ color: "var(--accent)", fontWeight: 600 }}>{fmtShort(d["Bank Income"])}</td>
                      <td style={{ color: "#10b981", fontWeight: 700 }}>{fmtShort(d["Received in Bank"])}</td>
                      <td style={{ color: d["Pending"] > 0 ? "#fbbf24" : "var(--green)", fontWeight: 600 }}>
                        {fmtShort(d["Pending"])}
                      </td>
                      <td style={{ color: "#f87171", fontWeight: 600 }}>−{fmtShort(d["Dev Payout"])}</td>
                      <td style={{ color: d["Net Profit"] >= 0 ? "var(--green)" : "#f87171", fontWeight: 700 }}>
                        {fmtShort(d["Net Profit"])}
                      </td>
                    </tr>
                  ))}
                  {monthData.length > 0 && (
                    <tr style={{ borderTop: "2px solid var(--border)", background: "#0a0f1e" }}>
                      <td style={{ fontWeight: 700 }}>TOTAL</td>
                      <td style={{ fontWeight: 700 }}>{filtered.length}</td>
                      <td style={{ color: "var(--accent)", fontWeight: 700 }}>{fmtShort(totals.totalBankIncome)}</td>
                      <td style={{ color: "#10b981", fontWeight: 800, fontSize: 15 }}>{fmtShort(totals.totalReceivedInBank)}</td>
                      <td style={{ color: "#fbbf24", fontWeight: 700 }}>{fmtShort(totals.totalPendingFromBank)}</td>
                      <td style={{ color: "#f87171", fontWeight: 700 }}>−{fmtShort(totals.totalDevPayout)}</td>
                      <td style={{ color: "var(--green)", fontWeight: 700, fontSize: 15 }}>{fmtShort(totals.totalProfit)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </TableCard>
          </div>

          {/* Project P&L */}
          {projectData.length > 0 && (
            <div className="card" style={{ padding: 22, marginBottom: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Project-wise P&L & Collections</div>
              <TableCard>
                <table>
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Developer</th>
                      <th>Dev %</th>
                      <th>Cases</th>
                      <th>Expected Income</th>
                      <th style={{ color: "#10b981" }}>Received in Bank</th>
                      <th>Pending</th>
                      <th>Dev Payout</th>
                      <th>Net Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectData.map(d => (
                      <tr key={d.project.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{d.project.name}</div>
                          <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{d.project.location}</div>
                        </td>
                        <td style={{ color: "var(--text-muted)" }}>{d.project.developer}</td>
                        <td>
                          <span className="tag" style={{ background: "#ec489920", color: "#ec4899" }}>
                            {d.project.developerPayoutPct || 0}%
                          </span>
                        </td>
                        <td>{d.cases}</td>
                        <td style={{ color: "var(--accent)", fontWeight: 600 }}>{fmtShort(d.income)}</td>
                        <td style={{ color: "#10b981", fontWeight: 700 }}>{fmtShort(d.received)}</td>
                        <td style={{ color: d.pending > 0 ? "#fbbf24" : "var(--green)" }}>{fmtShort(d.pending)}</td>
                        <td style={{ color: "#f87171", fontWeight: 600 }}>−{fmtShort(d.payout)}</td>
                        <td style={{ color: d.profit >= 0 ? "var(--green)" : "#f87171", fontWeight: 700 }}>{fmtShort(d.profit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableCard>
            </div>
          )}

          {/* Bank leaderboard with Received in Bank */}
          <div className="card" style={{ padding: 22 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Bank-wise Income & Receipts</div>
            <TableCard>
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Bank</th>
                    <th>Model</th>
                    <th>Commission %</th>
                    <th>Cases</th>
                    <th>Expected Income</th>
                    <th style={{ color: "#10b981" }}>Received in Bank</th>
                    <th>Pending</th>
                    <th>Collection %</th>
                  </tr>
                </thead>
                <tbody>
                  {bankData.map((d, i) => (
                    <tr key={d.bank.id}>
                      <td>
                        <span style={{
                          fontFamily: "var(--font-head)",
                          fontWeight: 700,
                          fontSize: 18,
                          color: ["var(--accent)", "var(--purple)", "var(--amber)", "var(--accent2)"][i] || "var(--text-faint)",
                        }}>
                          #{i + 1}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{
                            width: 26,
                            height: 26,
                            borderRadius: 6,
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid var(--border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--accent)",
                            flexShrink: 0,
                          }}>
                            <Landmark size={14} />
                          </span>
                          <span style={{ fontWeight: 600 }}>{d.bank.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="tag" style={{
                          background: d.bank.agreementType === "Net" ? "#6366f120" : "#00d4a120",
                          color: d.bank.agreementType === "Net" ? "#818cf8" : "var(--accent)",
                        }}>
                          {d.bank.agreementType}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{d.bank.agreementPct}%</td>
                      <td>{d.cases}</td>
                      <td style={{ color: "var(--accent)", fontWeight: 600 }}>{fmtShort(d.income)}</td>
                      <td style={{ color: "#10b981", fontWeight: 700 }}>{fmtShort(d.received)}</td>
                      <td style={{ color: d.pending > 0 ? "#fbbf24" : "var(--green)" }}>{fmtShort(d.pending)}</td>
                      <td>
                        <span className="tag" style={{
                          background: d.collRate >= 100 ? "#10b98122" : d.collRate > 0 ? "#0088ff22" : "#f59e0b22",
                          color: d.collRate >= 100 ? "#34d399" : d.collRate > 0 ? "#60a5fa" : "#fbbf24",
                          fontWeight: 700,
                        }}>
                          {d.collRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableCard>
          </div>
        </div>
      )}

      {/* ──────────────── MODAL: QUICK UPDATE BANK RECEIPT ──────────────── */}
      {editReceiptCase && (
        <Modal
          title={`Record Bank Receipt — ${editReceiptCase.clientName || "Case"}`}
          onClose={() => setEditReceiptCase(null)}
        >
          <div style={{
            background: "var(--bg-deep)",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-faint)" }}>Bank & Project</div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>
                {editReceiptCase.bank?.name} • {editReceiptCase.project?.name}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-faint)" }}>Disbursed Amount</div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>
                {fmtShort(editReceiptCase.disbursedAmt || editReceiptCase.loanAmt)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-faint)" }}>Expected Commission</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--accent)" }}>
                {fmtShort(editReceiptCase.expectedIncome)}
              </div>
            </div>
          </div>

          <div className="grid-2">
            <FormField label="Payment Status">
              <select
                value={receiptForm.amountReceivedStatus}
                onChange={e => {
                  const val = e.target.value;
                  setReceiptForm(prev => ({
                    ...prev,
                    amountReceivedStatus: val,
                    amountReceivedDate: (val === "Received" || val === "Partially Received") && !prev.amountReceivedDate
                      ? new Date().toISOString().split("T")[0]
                      : prev.amountReceivedDate,
                    amountReceivedBy: (val === "Received" || val === "Partially Received") && !prev.amountReceivedBy
                      ? (user?.name || "")
                      : prev.amountReceivedBy,
                    amountReceived: (val === "Received" || val === "Partially Received") && (!prev.amountReceived || prev.amountReceived === 0) && editReceiptCase.expectedIncome
                      ? Math.round(editReceiptCase.expectedIncome)
                      : prev.amountReceived,
                  }));
                }}
              >
                <option value="Pending">Pending / Not Received</option>
                <option value="Received">Received in Bank Account</option>
                <option value="Partially Received">Partially Received</option>
              </select>
            </FormField>

            <FormField label="Amount Received in Bank (₹)">
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  value={receiptForm.amountReceived}
                  onChange={e => setReceiptForm({ ...receiptForm, amountReceived: e.target.value })}
                  placeholder={editReceiptCase.expectedIncome ? `Expected: ₹${Math.round(editReceiptCase.expectedIncome)}` : "e.g. 50000"}
                />
                {editReceiptCase.expectedIncome > 0 && Number(receiptForm.amountReceived) !== Math.round(editReceiptCase.expectedIncome) && (
                  <button
                    type="button"
                    onClick={() => setReceiptForm(p => ({ ...p, amountReceived: Math.round(editReceiptCase.expectedIncome) }))}
                    style={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "var(--border)",
                      border: "none",
                      borderRadius: 4,
                      fontSize: 10,
                      padding: "3px 8px",
                      color: "var(--accent)",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                    title="Auto-fill expected bank commission"
                  >
                    Fill ₹{Math.round(editReceiptCase.expectedIncome)}
                  </button>
                )}
              </div>
            </FormField>

            <FormField label="Received Date">
              <DatePicker
                value={receiptForm.amountReceivedDate}
                onChange={e => setReceiptForm({ ...receiptForm, amountReceivedDate: e.target.value })}
              />
            </FormField>

            <FormField label="Received By">
              <input
                type="text"
                value={receiptForm.amountReceivedBy}
                onChange={e => setReceiptForm({ ...receiptForm, amountReceivedBy: e.target.value })}
                placeholder="Team member or accounts person"
              />
            </FormField>

            <FormField label="Bank Ref / UTR No." span={2}>
              <input
                type="text"
                value={receiptForm.utrRef}
                onChange={e => setReceiptForm({ ...receiptForm, utrRef: e.target.value })}
                placeholder="Transaction reference / UTR number"
              />
            </FormField>

            <FormField label="Remarks" span={2}>
              <textarea
                rows={2}
                value={receiptForm.accountsRemarks}
                onChange={e => setReceiptForm({ ...receiptForm, accountsRemarks: e.target.value })}
                placeholder="Notes about payment, bank account credited, TDS deductions, etc."
              />
            </FormField>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
            <Btn variant="ghost" onClick={() => setEditReceiptCase(null)}>Cancel</Btn>
            <Btn variant="primary" onClick={handleSaveReceipt} disabled={savingReceipt}>
              {savingReceipt ? "Saving…" : "Save Receipt"}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
