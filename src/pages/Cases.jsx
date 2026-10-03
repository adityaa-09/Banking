import React, { useState, useMemo, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import {
  SectionHeader, Btn, StatusTag, FormField, FormPanel,
  EmptyState, TableCard, FilterSelect, DetailGrid, DatePicker, MonthPicker,
} from "../components/UI";
import {
  fmtShort, fmtDate, calcCaseRevenue, calcSlotAmount, calcBankIncome, calcDevPayout,
} from "../utils/helpers";
import { addLog, getLogsForCase } from "../config/firebaseService";
import {
  CreditCard, AlertTriangle, Trash2, Phone, Mail, User,
  Pencil, ExternalLink, FileText, Check, X, Clock, Landmark,
} from "lucide-react";

// ─── helpers ──────────────────────────────────────────────────────────────────
function buildSlots(n, loanAmt) {
  const baseAmt = loanAmt > 0 ? Math.round(loanAmt / n) : 0;
  return Array.from({ length: n }, (_, i) => ({
    slotNo: i + 1, disbursed: false, disbursedOn: null,
    customAmt: baseAmt,   // FIX #1 — each slot has editable amount
    bankPaid: false, bankPaidOn: null,
  }));
}

function caseStatus(c, bank) {
  const type = c.loanPayoutType || bank?.agreementType;
  if (!bank) return c.status || "In Process";
  
  if (type === "Gross") {
    // Gross: check if disbursed
    if (c.disbursed && c.disbursedAmt > 0) return "Disbursed";
    return c.status || "In Process";
  }
  
  // Net: slot-based
  const slots = c.slots || [];
  if (!slots.length) return c.status === "Sanctioned" ? "Sanctioned" : "In Process";
  const done = slots.filter(s => s.disbursed).length;
  if (done === 0) return c.status === "Sanctioned" ? "Sanctioned" : "In Process";
  if (done < slots.length) return "Part Disbursed";
  return "Fully Disbursed";
}

const BLANK = {
  clientName: "", clientPhone: "", clientEmail: "",
  projectId: "", bankId: "", salesPoc: "",
  loanAmt: "", sanctionedAmt: "", disbursedAmt: "",
  disbursedMonth: "", month: "",
  status: "In Process", loanPayoutType: "Gross",
  disbursed: "no", disbursedDate: "",        // FIX #5 — disbursement date
  sanctionDate: "", sanctionDoc: "",
  devPayoutStatus: "Unpaid", devPayoutDate: "",
  totalSlots: "3", customSlots: "",          // FIX #1 — custom slot count
  devPayoutMode: "per_slot",
  slots: [],
  driveLink: "", remarks: "",
  amountReceivedStatus: "Pending",           // Accounts team fields
  amountReceived: "",
  amountReceivedDate: "",
  amountReceivedBy: "",
  utrRef: "",
  accountsRemarks: "",
};

export default function Cases() {
  const { cases, saveCase, removeCase, projects, banks, loading } = useApp();
  const { canEdit, canEditAccounts, user } = useAuth();

  const [showAdd,  setShowAdd]  = useState(false);
  const [editData, setEditData] = useState(null);
  const [form, setForm]         = useState({ ...BLANK, slots: buildSlots(3, 0) });
  const [saving, setSaving]     = useState(false);
  const [viewCase, setViewCase] = useState(null);
  const [caseLogs, setCaseLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const [fMonth,   setFMonth]   = useState("");
  const [fBank,    setFBank]    = useState("");
  const [fStatus,  setFStatus]  = useState("");
  const [fProject, setFProject] = useState("");
  const [fReceipt, setFReceipt] = useState("");
  const [search,   setSearch]   = useState("");

  const formBank    = banks.find(b => b.id === form.bankId);
  const isNet = (form.loanPayoutType || formBank?.agreementType) === "Net";

  // number of slots (custom or preset)
  const slotCount = () => {
    if (form.customSlots && Number(form.customSlots) > 0) return Number(form.customSlots);
    return Number(form.totalSlots) || 3;
  };

  const f = (k) => (e) => {
    const val = e.target?.value !== undefined ? e.target.value : e;
    setForm(prev => {
      const next = { ...prev, [k]: val };
      if (k === "totalSlots" || k === "customSlots") {
        const n = k === "customSlots" ? (Number(val)||3) : (Number(val)||3);
        next.slots = buildSlots(n, Number(prev.loanAmt)||0);
      }
      if (k === "loanAmt") {
        // Rebuild slot amounts when loan amount changes
        const n = slotCount();
        next.slots = buildSlots(n, Number(val)||0);
      }
      if (k === "loanPayoutType") {
        if (val === "Gross") next.slots = [];
        else next.slots = buildSlots(slotCount(), Number(prev.loanAmt)||0);
      }
      return next;
    });
  };

  // FIX #1 — edit individual slot amount
  const updateSlotAmt = (idx, amt) => {
    setForm(prev => ({
      ...prev,
      slots: prev.slots.map((s, i) => i === idx ? { ...s, customAmt: Number(amt) || 0 } : s),
    }));
  };

  const startAdd = () => {
    setShowAdd(true); setEditData(null);
    setForm({ ...BLANK, slots: buildSlots(3, 0) });
  };

  const startEdit = (c) => {
    setEditData(c);
    setForm({
      clientName: c.clientName || "", clientPhone: c.clientPhone || "", clientEmail: c.clientEmail || "",
      projectId: c.projectId || "", bankId: c.bankId || "", salesPoc: c.salesPoc || "",
      loanAmt: c.loanAmt || "", sanctionedAmt: c.sanctionedAmt || "",
      disbursedAmt: c.disbursedAmt || "", disbursedMonth: c.disbursedMonth || "",
      month: c.month || "", status: c.status || "In Process",
      loanPayoutType: c.loanPayoutType || "Gross",
      disbursed: c.disbursed ? "yes" : "no",
      disbursedDate: c.disbursedDate || "",   // FIX #5
      sanctionDate: c.sanctionDate || "", sanctionDoc: c.sanctionDoc || "",
      devPayoutStatus: c.devPayoutStatus || "Unpaid", devPayoutDate: c.devPayoutDate || "",
      totalSlots: c.totalSlots || 3, customSlots: c.customSlots || "",
      devPayoutMode: c.devPayoutMode || "per_slot",
      slots: c.slots || buildSlots(c.totalSlots || 3, c.loanAmt || 0),
      driveLink: c.driveLink || "", remarks: c.remarks || "",
      amountReceivedStatus: c.amountReceivedStatus || (c.amountReceived ? "Received" : "Pending"),
      amountReceived: c.amountReceived !== undefined ? c.amountReceived : "",
      amountReceivedDate: c.amountReceivedDate || "",
      amountReceivedBy: c.amountReceivedBy || "",
      utrRef: c.utrRef || "",
      accountsRemarks: c.accountsRemarks || "",
    });
    setShowAdd(false); setViewCase(null);
  };

  const handleSave = async () => {
    if (!form.clientName || !form.projectId || !form.bankId) {
      alert("Client name, Project and Bank are required."); return;
    }
    const n = slotCount();
    const isNowDisbursed = form.disbursed === "yes" && Number(form.disbursedAmt) > 0;
    const payload = {
      ...form,
      loanAmt:              Number(form.loanAmt) || 0,
      sanctionedAmt:        Number(form.sanctionedAmt) || Number(form.loanAmt) || 0,
      disbursedAmt:         Number(form.disbursedAmt) || 0,
      disbursed:            isNowDisbursed,
      // Auto-update status to Disbursed when disbursed amount is filled (Gross model)
      status: (!isNet && isNowDisbursed && form.status !== "Rejected") ? "Disbursed" : form.status,
      totalSlots:           n,
      customSlots:          form.customSlots,
      slots:                isNet ? (form.slots || buildSlots(n, Number(form.loanAmt)||0)) : [],
      amountReceivedStatus: form.amountReceivedStatus || "Pending",
      amountReceived:       form.amountReceived !== "" ? (Number(form.amountReceived) || 0) : 0,
      amountReceivedDate:   form.amountReceivedDate || "",
      amountReceivedBy:     form.amountReceivedBy || "",
      utrRef:               form.utrRef || "",
      accountsRemarks:      form.accountsRemarks || "",
      createdBy:            editData?.createdBy || user?.id,
      createdByName:        editData?.createdByName || user?.name,
    };
    setSaving(true);
    await saveCase(payload, editData?.id || null);
    if (editData?.id) {
      try { await addLog({ caseId: editData.id, action: "updated this case", userId: user?.id, userName: user?.name }); } catch {}
    }
    setSaving(false);
    setForm({ ...BLANK, slots: buildSlots(3, 0) });
    setEditData(null); setShowAdd(false);
  };

  const openCase = useCallback(async (c) => {
    setViewCase(c); setActiveTab("details");
    setLogsLoading(true);
    try { setCaseLogs(await getLogsForCase(c.id)); } catch { setCaseLogs([]); }
    setLogsLoading(false);
  }, []);

  // Update a slot (mark disbursed / bank paid) on existing saved case
  const updateSlot = async (c, slotIdx, field, value, extra = {}) => {
    const newSlots = (c.slots || []).map((s, i) => i === slotIdx ? {
      ...s, ...extra, [field]: value,
      ...(field === "disbursed" && value ? { disbursedOn: new Date().toISOString().split("T")[0] } : {}),
      ...(field === "bankPaid"  && value ? { bankPaidOn:  new Date().toISOString().split("T")[0] } : {}),
    } : s);
    const updated = { ...c, slots: newSlots };
    await saveCase(updated, c.id);
    try { await addLog({ caseId: c.id, action: `updated Slot ${slotIdx + 1}`, userId: user?.id, userName: user?.name }); } catch {}
    setViewCase(updated);
    try { setCaseLogs(await getLogsForCase(c.id)); } catch {}
  };

  // FIX #4 — edit disbursed amount on Net case inline
  const updateGrossDisbursed = async (c, newAmt, newDate) => {
    const updated = { ...c, disbursedAmt: Number(newAmt) || 0, disbursedDate: newDate || c.disbursedDate, disbursed: true };
    await saveCase(updated, c.id);
    setViewCase(updated);
  };

  // Quick update for accounts receipt from CaseModal
  const updateAccountsReceipt = async (c, receiptData) => {
    const updated = {
      ...c,
      amountReceivedStatus: receiptData.amountReceivedStatus || "Received",
      amountReceived:       Number(receiptData.amountReceived) || 0,
      amountReceivedDate:   receiptData.amountReceivedDate || new Date().toISOString().split("T")[0],
      amountReceivedBy:     receiptData.amountReceivedBy || user?.name || "",
      utrRef:               receiptData.utrRef || "",
      accountsRemarks:      receiptData.accountsRemarks || "",
    };
    await saveCase(updated, c.id);
    try {
      await addLog({
        caseId: c.id,
        action: `updated Accounts receipt (${updated.amountReceivedStatus}: ₹${updated.amountReceived} received by ${updated.amountReceivedBy})`,
        userId: user?.id,
        userName: user?.name,
      });
    } catch {}
    setViewCase(updated);
    try { setCaseLogs(await getLogsForCase(c.id)); } catch {}
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await removeCase(deleteTarget.id);
    setDeleting(false); setDeleteTarget(null); setViewCase(null);
  };

  // Preview P&L
  const previewPL = useMemo(() => {
    if (!formBank) return null;
    const project = projects.find(p => p.id === form.projectId);
    if (!project) return null;
    const dummy = {
      loanAmt: Number(form.loanAmt)||0, disbursedAmt: Number(form.disbursedAmt)||0,
      disbursed: form.disbursed === "yes",
      totalSlots: slotCount(), slots: form.slots || [],
      devPayoutMode: form.devPayoutMode, loanPayoutType: form.loanPayoutType,
    };
    const fakBank = { ...formBank, agreementType: form.loanPayoutType || formBank.agreementType };
    return calcCaseRevenue(dummy, fakBank, project);
  }, [form, formBank, projects]);

  const months      = [...new Set(cases.map(c => c.month).filter(Boolean))].sort();
  const allStatuses = ["In Process","Sanctioned","Disbursed","Part Disbursed","Fully Disbursed","Rejected"];

  const filtered = cases.filter(c => {
    const bank = banks.find(b => b.id === c.bankId);
    const isReceived = c.amountReceivedStatus === "Received" || Number(c.amountReceived) > 0;
    return (
      (!fMonth   || c.month === fMonth) &&
      (!fBank    || c.bankId === fBank) &&
      (!fProject || c.projectId === fProject) &&
      (!fStatus  || caseStatus(c, bank) === fStatus) &&
      (!fReceipt || (fReceipt === "Received" ? isReceived : !isReceived)) &&
      (!search   || [c.clientName, c.clientPhone, c.clientEmail, c.salesPoc]
        .some(v => v?.toLowerCase().includes(search.toLowerCase())))
    );
  });

  const isEditing = showAdd || !!editData;

  return (
    <div>
      <SectionHeader
        title="Case Management"
        sub="Track all loan cases — Gross (lump sum) and Net (slot-based)"
        action={canEdit && !isEditing && <Btn variant="primary" onClick={startAdd}>+ Add Case</Btn>}
      />

      {/* FORM */}
      {isEditing && canEdit && (
        <FormPanel
          title={editData ? `Edit — ${editData.clientName}` : "New Case"}
          onSave={handleSave}
          onCancel={() => { setShowAdd(false); setEditData(null); }}
          saveLabel={saving ? "Saving…" : (editData ? "Update Case" : "Save Case")}
        >
          <SL>Client Information</SL>
          <div className="grid-3">
            <FormField label="Full Name"><input value={form.clientName} onChange={f("clientName")} /></FormField>
            <FormField label="Phone"><input value={form.clientPhone} onChange={f("clientPhone")} /></FormField>
            <FormField label="Email"><input type="email" value={form.clientEmail} onChange={f("clientEmail")} /></FormField>
          </div>

          <SL style={{ marginTop:14 }}>Loan Details</SL>
          <div className="grid-3">
            <FormField label="Project" span={2}>
              <select value={form.projectId} onChange={f("projectId")}>
                <option value="">Select Project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name} (Dev: {p.developerPayoutPct||0}% of loan)</option>)}
              </select>
            </FormField>
            <FormField label="Bank">
              <select value={form.bankId} onChange={f("bankId")}>
                <option value="">Select Bank</option>
                {banks.map(b => <option key={b.id} value={b.id}>{b.name} ({b.agreementType} {b.agreementPct}%)</option>)}
              </select>
            </FormField>
            <FormField label="Loan Amount (₹)"><input type="number" value={form.loanAmt} onChange={f("loanAmt")} /></FormField>
            <FormField label="Sanctioned Amount (₹)"><input type="number" value={form.sanctionedAmt} onChange={f("sanctionedAmt")} /></FormField>
            <FormField label="Month (YYYY-MM)"><MonthPicker value={form.month} onChange={f("month")} /></FormField>
            <FormField label="Status">
              <select value={form.status} onChange={f("status")}>
                <option>In Process</option>
                <option>Sanctioned</option>
                <option>Disbursed</option>
                <option>Rejected</option>
              </select>
            </FormField>
            <FormField label="Sales POC"><input value={form.salesPoc} onChange={f("salesPoc")} placeholder="Sales person name" /></FormField>
            <FormField label="Sanction Date"><DatePicker value={form.sanctionDate} onChange={f("sanctionDate")} /></FormField>
            <FormField label="Sanction Doc"><input value={form.sanctionDoc} onChange={f("sanctionDoc")} placeholder="SanctionLetter.pdf" /></FormField>
          </div>

          <SL style={{ marginTop:14 }}>
            Payout Model —&nbsp;
            <span style={{ color: isNet ? "#818cf8" : "var(--accent)", fontWeight:700 }}>
              {isNet ? "Net (Slot-based)" : "Gross (Lump sum)"}
            </span>
          </SL>
          <div className="grid-3">
            <FormField label="Payout Type">
              <select value={form.loanPayoutType} onChange={f("loanPayoutType")}>
                <option value="Gross">Gross — One lump sum</option>
                <option value="Net">Net — Per slot/cycle</option>
              </select>
            </FormField>

            {/* GROSS fields */}
            {!isNet && <>
              <FormField label="Disbursed?">
                <select value={form.disbursed} onChange={f("disbursed")}>
                  <option value="no">Not yet</option><option value="yes">Yes</option>
                </select>
              </FormField>
              {form.disbursed === "yes" && <>
                {/* FIX #4 — editable disbursed amount */}
                <FormField label="Disbursed Amount (₹)">
                  <input type="number" value={form.disbursedAmt} onChange={f("disbursedAmt")} />
                </FormField>
                {/* FIX #5 — disbursement date */}
                <FormField label="Disbursement Date">
                  <DatePicker value={form.disbursedDate} onChange={f("disbursedDate")} />
                </FormField>
              </>}
              <FormField label="Dev Payout Status">
                <select value={form.devPayoutStatus} onChange={f("devPayoutStatus")}>
                  <option value="Unpaid">Unpaid</option><option value="Paid">Paid</option>
                </select>
              </FormField>
              {form.devPayoutStatus === "Paid" && (
                <FormField label="Dev Payout Date">
                  <DatePicker value={form.devPayoutDate} onChange={f("devPayoutDate")} />
                </FormField>
              )}
            </>}

            {/* NET fields */}
            {isNet && <>
              {/* FIX #1 — preset OR custom slot count */}
              <FormField label="Preset Slots">
                <select value={form.totalSlots} onChange={f("totalSlots")}>
                  {[2,3,4,5,6,8,10,12].map(n => <option key={n} value={n}>{n} slots</option>)}
                </select>
              </FormField>
              <FormField label="Custom Slot Count (overrides preset)">
                <input type="number" min="1" max="60" value={form.customSlots}
                  onChange={f("customSlots")} placeholder="e.g. 15 (leave blank to use preset)" />
              </FormField>
              <FormField label="Dev Payout Mode">
                <select value={form.devPayoutMode} onChange={f("devPayoutMode")}>
                  <option value="per_slot">Per Slot</option>
                  <option value="lump_sum">Lump Sum at end</option>
                </select>
              </FormField>
            </>}
          </div>

          {/* NET — slot amount editor (FIX #1) */}
          {isNet && form.loanAmt && (
            <div style={{ marginTop:14 }}>
              <div style={{ fontSize:12, fontWeight:600, color:"var(--text-faint)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>
                Slot Amounts — {slotCount()} slots
                <span style={{ fontWeight:400, color:"var(--text-dim)", marginLeft:8 }}>
                  (edit each slot amount individually if needed)
                </span>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
                {(form.slots || buildSlots(slotCount(), Number(form.loanAmt))).map((s, i) => (
                  <div key={i} style={{ background:"var(--bg-deep)", border:"1px solid var(--border)", borderRadius:10, padding:"10px 14px", minWidth:160 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:"var(--text-muted)", marginBottom:6 }}>Slot {i+1}</div>
                    <input
                      type="number"
                      value={s.customAmt || ""}
                      onChange={e => updateSlotAmt(i, e.target.value)}
                      placeholder={String(Math.round((Number(form.loanAmt)||0) / slotCount()))}
                      style={{ fontSize:13, padding:"6px 10px", width:"100%" }}
                    />
                    {formBank && (
                      <div style={{ fontSize:11, color:"var(--text-faint)", marginTop:4 }}>
                        Bank: {fmtShort(calcBankIncome(s.customAmt||0, formBank.agreementPct))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* P&L preview */}
          {previewPL && Number(form.loanAmt) > 0 && (
            <div style={{ marginTop:14, background:"var(--bg-deep)", borderRadius:10, padding:"12px 16px", display:"flex", gap:24, flexWrap:"wrap" }}>
              <PLItem label="Bank Income"  value={previewPL.bankIncome} color="var(--accent)" />
              <PLItem label="Dev Payout"   value={previewPL.devPayout}  color="#f87171" neg />
              <PLItem label="Net Profit"   value={previewPL.profit}     color={previewPL.profit>=0?"var(--green)":"#f87171"} bold />
              {!isNet && form.disbursed !== "yes" && (
                <div style={{ fontSize:11, color:"var(--amber)", alignSelf:"center", display:"flex", alignItems:"center", gap:4 }}>
                  <AlertTriangle size={12} /> Profit shows ₹0 until disbursed
                </div>
              )}
            </div>
          )}

          <div className="grid-3" style={{ marginTop:14 }}>
            <FormField label="Disbursement Month"><MonthPicker value={form.disbursedMonth} onChange={f("disbursedMonth")} /></FormField>
            <FormField label="Google Drive Link" span={2}>
              <input value={form.driveLink} onChange={f("driveLink")} placeholder="https://drive.google.com/..." />
            </FormField>
            <FormField label="Remarks" span={3}><textarea rows={2} value={form.remarks} onChange={f("remarks")} /></FormField>
          </div>

          {/* ACCOUNTS TEAM — AMOUNT RECEIVED IN BANK */}
          <div style={{
            marginTop: 18,
            background: "linear-gradient(135deg, rgba(0, 212, 161, 0.05), rgba(0, 136, 255, 0.05))",
            border: "1px solid rgba(0, 212, 161, 0.25)",
            borderRadius: 12,
            padding: "16px 18px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CreditCard size={16} style={{ color: "var(--accent)" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Accounts Team — Amount Received in Bank
                </span>
              </div>
              <span className="tag" style={{
                background: form.amountReceivedStatus === "Received" ? "#10b98122" : form.amountReceivedStatus === "Partially Received" ? "#0088ff22" : "#f59e0b22",
                color: form.amountReceivedStatus === "Received" ? "#34d399" : form.amountReceivedStatus === "Partially Received" ? "#60a5fa" : "#fbbf24",
                fontWeight: 600,
              }}>
                {form.amountReceivedStatus || "Pending"}
              </span>
            </div>

            <div className="grid-3">
              <FormField label="Payment Status">
                <select value={form.amountReceivedStatus || "Pending"} onChange={e => {
                  const val = e.target.value;
                  setForm(prev => ({
                    ...prev,
                    amountReceivedStatus: val,
                    amountReceivedDate: (val === "Received" || val === "Partially Received") && !prev.amountReceivedDate
                      ? new Date().toISOString().split("T")[0]
                      : prev.amountReceivedDate,
                    amountReceivedBy: (val === "Received" || val === "Partially Received") && !prev.amountReceivedBy
                      ? (user?.name || "")
                      : prev.amountReceivedBy,
                    amountReceived: (val === "Received" || val === "Partially Received") && (!prev.amountReceived || prev.amountReceived === 0) && previewPL?.bankIncome
                      ? Math.round(previewPL.bankIncome)
                      : prev.amountReceived,
                  }));
                }}>
                  <option value="Pending">Pending / Not Received</option>
                  <option value="Received">Received in Bank Account</option>
                  <option value="Partially Received">Partially Received</option>
                </select>
              </FormField>

              <FormField label="Amount Received (₹)">
                <div style={{ position: "relative" }}>
                  <input
                    type="number"
                    value={form.amountReceived}
                    onChange={f("amountReceived")}
                    placeholder={previewPL?.bankIncome ? `Expected: ₹${Math.round(previewPL.bankIncome)}` : "e.g. 50000"}
                  />
                  {previewPL?.bankIncome > 0 && Number(form.amountReceived) !== Math.round(previewPL.bankIncome) && (
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, amountReceived: Math.round(previewPL.bankIncome) }))}
                      style={{
                        position: "absolute",
                        right: 8,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "var(--border)",
                        border: "none",
                        borderRadius: 4,
                        fontSize: 10,
                        padding: "2px 6px",
                        color: "var(--accent)",
                        cursor: "pointer",
                      }}
                      title="Auto-fill expected bank commission"
                    >
                      Fill ₹{Math.round(previewPL.bankIncome)}
                    </button>
                  )}
                </div>
              </FormField>

              <FormField label="Received Date">
                <DatePicker
                  value={form.amountReceivedDate}
                  onChange={f("amountReceivedDate")}
                />
              </FormField>

              <FormField label="Received By">
                <input
                  type="text"
                  value={form.amountReceivedBy}
                  onChange={f("amountReceivedBy")}
                  placeholder="Person / Accounts member name"
                />
              </FormField>

              <FormField label="Bank Ref / UTR No.">
                <input
                  type="text"
                  value={form.utrRef}
                  onChange={f("utrRef")}
                  placeholder="e.g. UTR / Transaction ID"
                />
              </FormField>

              <FormField label="Accounts Remarks">
                <input
                  type="text"
                  value={form.accountsRemarks}
                  onChange={f("accountsRemarks")}
                  placeholder="Bank A/C details / payment note"
                />
              </FormField>
            </div>
          </div>
        </FormPanel>
      )}

      {/* Filters */}
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search client, phone, email, POC…" style={{ width:240 }} />
        <FilterSelect value={fMonth}   onChange={setFMonth}   placeholder="All Months"   options={months.map(m=>[m,m])} />
        <FilterSelect value={fProject} onChange={setFProject} placeholder="All Projects"  options={projects.map(p=>[p.id,p.name])} />
        <FilterSelect value={fBank}    onChange={setFBank}    placeholder="All Banks"     options={banks.map(b=>[b.id,b.name])} />
        <FilterSelect value={fStatus}  onChange={setFStatus}  placeholder="All Status"    options={allStatuses.map(s=>[s,s])} />
        <FilterSelect value={fReceipt} onChange={setFReceipt} placeholder="All Receipts"  options={[["Received","Received in Bank"],["Pending","Pending Receipt"]]} />
        <div style={{ marginLeft:"auto", fontSize:13, color:"var(--text-faint)" }}>{filtered.length} case{filtered.length!==1?"s":""}</div>
      </div>

      {/* Table */}
      {loading ? <div style={{ textAlign:"center", padding:60, color:"var(--text-faint)" }}>Loading…</div>
      : filtered.length === 0 ? <EmptyState message="No cases found." />
      : (
        <TableCard>
          <table>
            <thead>
              <tr>
                <th>Client</th><th>Contact</th><th>Sales POC</th><th>Project</th>
                <th>Bank</th><th>Model</th><th>Loan Amt</th><th>Disbursed</th>
                <th>Month</th><th>Status</th><th>Bank Income</th><th>Bank Receipt</th><th>Created By</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const bank    = banks.find(b=>b.id===c.bankId);
                const project = projects.find(p=>p.id===c.projectId);
                const fakBank = bank ? { ...bank, agreementType: c.loanPayoutType||bank.agreementType } : bank;
                const rev     = calcCaseRevenue(c, fakBank, project);
                const isNetCase = (c.loanPayoutType||bank?.agreementType) === "Net";
                const disbSlots = isNetCase ? (c.slots||[]).filter(s=>s.disbursed).length : null;
                const status = caseStatus(c, bank);
                return (
                  <tr key={c.id} onClick={()=>openCase(c)} style={{ cursor:"pointer" }}>
                    <td><div style={{ fontWeight:600 }}>{c.clientName}</div></td>
                    <td style={{ fontSize:12, color:"var(--text-muted)" }}>
                      <div>{c.clientPhone||"—"}</div>
                      <div style={{ fontSize:11 }}>{c.clientEmail||""}</div>
                    </td>
                    <td style={{ fontSize:12, color:"var(--accent2)" }}>{c.salesPoc||"—"}</td>
                    <td style={{ fontSize:12, maxWidth:120 }}><div>{project?.name}</div></td>
                    <td>
                      <span style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
                        <Landmark size={14} style={{ color:"var(--accent)", flexShrink:0 }} />
                        <span>{bank?.name}</span>
                      </span>
                    </td>
                    <td>
                      <span className="tag" style={{ background:isNetCase?"#6366f120":"#00d4a120", color:isNetCase?"#818cf8":"var(--accent)" }}>
                        {c.loanPayoutType||bank?.agreementType||"—"}
                      </span>
                    </td>
                    <td style={{ color:"var(--accent2)", fontWeight:600 }}>{fmtShort(c.loanAmt)}</td>
                    <td style={{ fontSize:12 }}>
                      {isNetCase
                        ? <span style={{ color:"var(--accent2)" }}>{disbSlots}/{c.totalSlots||"?"} slots</span>
                        : c.disbursed
                          ? <span style={{ color:"var(--accent)", display:"inline-flex", alignItems:"center", gap:3 }}><Check size={12} /> {fmtShort(c.disbursedAmt)}</span>
                          : <span style={{ color:"var(--text-faint)" }}>Pending</span>
                      }
                    </td>
                    <td style={{ color:"var(--text-muted)", fontSize:12 }}>{c.month}</td>
                    <td><StatusTag status={status} /></td>
                    <td style={{ color:"var(--accent)", fontWeight:600 }}>{fmtShort(rev.bankIncome)}</td>
                    <td style={{ fontSize:12 }}>
                      {c.amountReceivedStatus === "Received" || Number(c.amountReceived) > 0 ? (
                        <div>
                          <span style={{ color:"var(--green)", fontWeight:600, display:"inline-flex", alignItems:"center", gap:3 }}>
                            <Check size={12} /> {fmtShort(c.amountReceived)}
                          </span>
                          {c.amountReceivedDate && (
                            <div style={{ fontSize:10, color:"var(--text-faint)" }}>
                              {fmtDate(c.amountReceivedDate)}
                            </div>
                          )}
                          {c.amountReceivedBy && (
                            <div style={{ fontSize:10, color:"var(--accent2)" }}>
                              {c.amountReceivedBy}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color:"var(--amber)", fontSize:11, background:"#f59e0b15", padding:"2px 6px", borderRadius:4, display:"inline-flex", alignItems:"center", gap:3 }}>
                          <Clock size={10} /> Pending
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize:11, color:"var(--text-faint)" }}>{c.createdByName||"—"}</td>
                    <td onClick={e=>e.stopPropagation()}>
                      {canEdit && (
                        <button onClick={()=>setDeleteTarget(c)}
                          title="Delete case"
                          style={{ background:"#ef444415", border:"1px solid #ef444435", borderRadius:6, color:"#f87171", padding:"5px 8px", cursor:"pointer", display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableCard>
      )}

      {/* Case detail modal */}
      {viewCase && (
        <CaseModal
          c={viewCase}
          bank={banks.find(b=>b.id===viewCase.bankId)}
          project={projects.find(p=>p.id===viewCase.projectId)}
          logs={caseLogs} logsLoading={logsLoading}
          onClose={()=>setViewCase(null)}
          onEdit={canEdit ? ()=>startEdit(viewCase) : null}
          onUpdateSlot={canEdit ? updateSlot : null}
          onUpdateGross={canEdit ? updateGrossDisbursed : null}
          onUpdateAccounts={canEditAccounts ? updateAccountsReceipt : null}
          activeTab={activeTab} setActiveTab={setActiveTab}
        />
      )}

      {/* Confirm delete */}
      {deleteTarget && (
        <div className="overlay" onClick={()=>setDeleteTarget(null)}>
          <div style={{ background:"var(--bg-card)", border:"1px solid #ef444450", borderRadius:16, padding:28, maxWidth:400, width:"90%" }} onClick={e=>e.stopPropagation()}>
            <div style={{ width:48, height:48, borderRadius:12, background:"#ef444420", border:"1px solid #ef444440", display:"flex", alignItems:"center", justifyContent:"center", color:"#ef4444", marginBottom:16 }}>
              <Trash2 size={24} />
            </div>
            <div style={{ fontFamily:"var(--font-head)", fontSize:18, fontWeight:700, marginBottom:8 }}>Delete case: {deleteTarget.clientName}?</div>
            <div style={{ fontSize:13, color:"var(--text-faint)", marginBottom:24 }}>This cannot be undone. All logs for this case will also be deleted.</div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={handleDelete} disabled={deleting}
                style={{ flex:1, padding:"11px 0", background:"#ef4444", border:"none", borderRadius:9, color:"#fff", fontWeight:700, fontSize:14, cursor:"pointer" }}>
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
              <button onClick={()=>setDeleteTarget(null)}
                style={{ flex:1, padding:"11px 0", background:"var(--border)", border:"none", borderRadius:9, color:"var(--text)", fontWeight:600, fontSize:14, cursor:"pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CASE DETAIL MODAL ────────────────────────────────────────────────────────
function CaseModal({ c, bank, project, logs, logsLoading, onClose, onEdit, onUpdateSlot, onUpdateGross, onUpdateAccounts, activeTab, setActiveTab }) {
  const { user } = useAuth();
  const fakBank = bank ? { ...bank, agreementType: c.loanPayoutType || bank.agreementType } : bank;
  const rev = calcCaseRevenue(c, fakBank, project);
  const isNet = (c.loanPayoutType || bank?.agreementType) === "Net";

  // FIX #4 — inline edit for Gross disbursed amount
  const [editingDisb, setEditingDisb] = useState(false);
  const [disbAmt, setDisbAmt]   = useState(c.disbursedAmt || "");
  const [disbDate, setDisbDate] = useState(c.disbursedDate || "");

  const saveDisb = () => {
    if (onUpdateGross) onUpdateGross(c, disbAmt, disbDate);
    setEditingDisb(false);
  };

  // Accounts team — inline edit for amount received in bank
  const [editingAccounts, setEditingAccounts] = useState(false);
  const [accStatus, setAccStatus] = useState(c.amountReceivedStatus || (c.amountReceived ? "Received" : "Pending"));
  const [accAmt, setAccAmt]       = useState(c.amountReceived !== undefined && c.amountReceived !== "" ? c.amountReceived : "");
  const [accDate, setAccDate]     = useState(c.amountReceivedDate || "");
  const [accBy, setAccBy]         = useState(c.amountReceivedBy || "");
  const [accUtr, setAccUtr]       = useState(c.utrRef || "");
  const [accNotes, setAccNotes]   = useState(c.accountsRemarks || "");

  const saveAccounts = () => {
    if (onUpdateAccounts) {
      onUpdateAccounts(c, {
        amountReceivedStatus: accStatus,
        amountReceived: accAmt,
        amountReceivedDate: accDate,
        amountReceivedBy: accBy,
        utrRef: accUtr,
        accountsRemarks: accNotes,
      });
    }
    setEditingAccounts(false);
  };

  // FIX #1 — inline edit slot amounts on existing case
  const [editSlotIdx, setEditSlotIdx] = useState(null);
  const [editSlotAmt, setEditSlotAmt] = useState("");

  const saveSlotAmt = async (slotIdx) => {
    if (onUpdateSlot) await onUpdateSlot(c, slotIdx, "customAmt", Number(editSlotAmt) || 0, { customAmt: Number(editSlotAmt)||0 });
    setEditSlotIdx(null);
  };

  const TABS = ["details", ...(isNet ? ["slots"] : []), "logs"];

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:640, maxHeight:"85vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
          <div>
            <div style={{ fontFamily:"var(--font-head)", fontSize:20, fontWeight:700 }}>{c.clientName}</div>
            <div style={{ fontSize:12, color:"var(--text-faint)", marginTop:2, display:"flex", gap:12 }}>
              {c.clientPhone && <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}><Phone size={12} /> {c.clientPhone}</span>}
              {c.clientEmail && <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}><Mail size={12} /> {c.clientEmail}</span>}
            </div>
            {c.salesPoc && <div style={{ fontSize:12, color:"var(--accent2)", marginTop:4, display:"inline-flex", alignItems:"center", gap:4 }}><User size={12} /> Sales: {c.salesPoc}</div>}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <span className="tag" style={{ background:isNet?"#6366f120":"#00d4a120", color:isNet?"#818cf8":"var(--accent)" }}>
              {c.loanPayoutType || bank?.agreementType}
            </span>
            <StatusTag status={caseStatus(c, bank)} />
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:4, marginBottom:16, borderBottom:"1px solid var(--border)", paddingBottom:8 }}>
          {TABS.map(t => (
            <button key={t} onClick={()=>setActiveTab(t)}
              style={{ padding:"6px 16px", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"var(--font-body)", fontSize:12, fontWeight:activeTab===t?700:400,
                background:activeTab===t?"var(--accent)":"transparent", color:activeTab===t?"#060c18":"var(--text-muted)" }}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>

        {/* DETAILS */}
        {activeTab === "details" && (
          <>
            <DetailGrid items={[
              ["Project",        project?.name],
              ["Bank",           bank?.name],
              ["Month",          c.month],
              ["Disbursed Month",c.disbursedMonth||"—"],
              ["Loan Amount",    fmtShort(c.loanAmt)],
              ["Sanctioned Amt", fmtShort(c.sanctionedAmt)],
              ["Sanction Date",  fmtDate(c.sanctionDate)],
              ["Bank %",         `${bank?.agreementPct||0}% (${bank?.agreementType})`],
              ["Dev Payout %",   `${project?.developerPayoutPct||0}% of loan (${isNet ? "disbursed" : "total"})`],
              ["Sanction Doc",   c.sanctionDoc||"—"],
              ["Dev Payout",     c.devPayoutStatus||"—"],
            ]} />

            {/* Revenue — only shows actual disbursed income */}
            <div style={{ background:"var(--bg-deep)", borderRadius:12, padding:16, marginBottom:14 }}>
              <div style={{ fontWeight:600, fontSize:12, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>
                Revenue (disbursed only)
              </div>
              <RevRow label={`Bank Income (${bank?.agreementPct}%)`} value={rev.bankIncome} color="var(--accent)" />
              <RevRow label={`Dev Payout (${project?.developerPayoutPct||0}% of ${isNet ? "disbursed" : "total loan"})`} value={rev.devPayout} color="#f87171" neg />
              <div style={{ borderTop:"1px solid var(--border)", paddingTop:8, display:"flex", justifyContent:"space-between", fontWeight:700, fontSize:15 }}>
                <span>Net Profit</span>
                <span style={{ color:rev.profit>=0?"var(--green)":"#f87171" }}>{fmtShort(rev.profit)}</span>
              </div>
              {!isNet && !c.disbursed && (
                <div style={{ marginTop:8, fontSize:11, color:"var(--amber)", display:"flex", alignItems:"center", gap:4 }}>
                  <AlertTriangle size={12} /> Profit is ₹0 — case not disbursed yet
                </div>
              )}
            </div>

            {/* Accounts Team — Bank Receipt */}
            <div style={{
              background: "var(--bg-deep)",
              border: "1px solid rgba(0, 212, 161, 0.25)",
              borderRadius: 12,
              padding: 16,
              marginBottom: 14
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CreditCard size={16} style={{ color: "var(--accent)" }} />
                  <span style={{ fontWeight: 600, fontSize: 12, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Accounts Team — Amount Received in Bank
                  </span>
                </div>
                {onUpdateAccounts && !editingAccounts && (
                  <button
                    onClick={() => {
                      setAccStatus(c.amountReceivedStatus || (c.amountReceived ? "Received" : "Pending"));
                      setAccAmt(c.amountReceived !== undefined && c.amountReceived !== "" ? c.amountReceived : (rev.bankIncome ? Math.round(rev.bankIncome) : ""));
                      setAccDate(c.amountReceivedDate || new Date().toISOString().split("T")[0]);
                      setAccBy(c.amountReceivedBy || user?.name || "");
                      setAccUtr(c.utrRef || "");
                      setAccNotes(c.accountsRemarks || "");
                      setEditingAccounts(true);
                    }}
                    style={{ background: "var(--border)", border: "none", borderRadius: 6, color: "var(--text)", fontSize: 12, padding: "4px 10px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}
                  >
                    <Pencil size={12} /> Update Receipt
                  </button>
                )}
              </div>

              {editingAccounts ? (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, color: "var(--text-faint)", display: "block", marginBottom: 4 }}>Payment Status</label>
                      <select value={accStatus} onChange={e => {
                        const val = e.target.value;
                        setAccStatus(val);
                        if ((val === "Received" || val === "Partially Received") && !accDate) {
                          setAccDate(new Date().toISOString().split("T")[0]);
                        }
                        if ((val === "Received" || val === "Partially Received") && !accBy) {
                          setAccBy(user?.name || "");
                        }
                        if ((val === "Received" || val === "Partially Received") && (!accAmt || accAmt === 0) && rev.bankIncome) {
                          setAccAmt(Math.round(rev.bankIncome));
                        }
                      }} style={{ width: "100%", padding: "7px 10px", fontSize: 13 }}>
                        <option value="Pending">Pending</option>
                        <option value="Received">Received</option>
                        <option value="Partially Received">Partially Received</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "var(--text-faint)", display: "block", marginBottom: 4 }}>Amount Received (₹)</label>
                      <input type="number" value={accAmt} onChange={e => setAccAmt(e.target.value)} style={{ width: "100%", padding: "7px 10px", fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "var(--text-faint)", display: "block", marginBottom: 4 }}>Received Date</label>
                      <DatePicker value={accDate} onChange={e => setAccDate(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "var(--text-faint)", display: "block", marginBottom: 4 }}>Received By</label>
                      <input type="text" value={accBy} onChange={e => setAccBy(e.target.value)} placeholder="Person / Accounts member name" style={{ width: "100%", padding: "7px 10px", fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "var(--text-faint)", display: "block", marginBottom: 4 }}>Bank Ref / UTR No.</label>
                      <input type="text" value={accUtr} onChange={e => setAccUtr(e.target.value)} placeholder="UTR / Transaction ID" style={{ width: "100%", padding: "7px 10px", fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "var(--text-faint)", display: "block", marginBottom: 4 }}>Accounts Notes</label>
                      <input type="text" value={accNotes} onChange={e => setAccNotes(e.target.value)} placeholder="Bank A/C / Notes" style={{ width: "100%", padding: "7px 10px", fontSize: 13 }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={saveAccounts} style={{ padding: "7px 16px", background: "var(--accent)", border: "none", borderRadius: 7, color: "#060c18", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Save</button>
                    <button onClick={() => setEditingAccounts(false)} style={{ padding: "7px 16px", background: "var(--border)", border: "none", borderRadius: 7, color: "var(--text)", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }}>
                  <div>
                    <span style={{ color: "var(--text-faint)" }}>Status: </span>
                    <span style={{
                      color: c.amountReceivedStatus === "Received" ? "var(--green)" : c.amountReceivedStatus === "Partially Received" ? "var(--accent2)" : "var(--amber)",
                      fontWeight: 600,
                    }}>
                      {c.amountReceivedStatus || (c.amountReceived ? "Received" : "Pending")}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-faint)" }}>Amount in Bank: </span>
                    <span style={{ color: "var(--accent)", fontWeight: 700 }}>
                      {c.amountReceived ? fmtShort(c.amountReceived) : "₹0"}
                    </span>
                  </div>
                  {c.amountReceivedDate && (
                    <div>
                      <span style={{ color: "var(--text-faint)" }}>Received On: </span>
                      <span style={{ color: "var(--text-muted)" }}>{fmtDate(c.amountReceivedDate)}</span>
                    </div>
                  )}
                  {c.amountReceivedBy && (
                    <div>
                      <span style={{ color: "var(--text-faint)" }}>Received By: </span>
                      <span style={{ color: "var(--accent2)", fontWeight: 600 }}>{c.amountReceivedBy}</span>
                    </div>
                  )}
                  {c.utrRef && (
                    <div>
                      <span style={{ color: "var(--text-faint)" }}>UTR / Ref: </span>
                      <span style={{ color: "var(--text-muted)", fontFamily: "monospace" }}>{c.utrRef}</span>
                    </div>
                  )}
                  {c.accountsRemarks && (
                    <div style={{ gridColumn: "span 2" }}>
                      <span style={{ color: "var(--text-faint)" }}>Notes: </span>
                      <span style={{ color: "var(--text-muted)" }}>{c.accountsRemarks}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* GROSS disbursement — FIX #4 editable */}
            {!isNet && (
              <div style={{ background:"var(--bg-deep)", border:"1px solid var(--border)", borderRadius:10, padding:14, marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>Disbursement (Gross)</div>
                  {onUpdateGross && !editingDisb && (
                    <button onClick={()=>{ setDisbAmt(c.disbursedAmt||""); setDisbDate(c.disbursedDate||""); setEditingDisb(true); }}
                      style={{ background:"var(--border)", border:"none", borderRadius:6, color:"var(--text)", fontSize:12, padding:"4px 10px", cursor:"pointer", display:"inline-flex", alignItems:"center", gap:4 }}>
                      <Pencil size={12} /> Edit
                    </button>
                  )}
                </div>
                {editingDisb ? (
                  <div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                      <div>
                        <label>Disbursed Amount (₹)</label>
                        <input type="number" value={disbAmt} onChange={e=>setDisbAmt(e.target.value)} />
                      </div>
                      <div>
                        <label>Disbursement Date</label>
                        <DatePicker value={disbDate} onChange={e=>setDisbDate(e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={saveDisb} style={{ padding:"7px 16px", background:"var(--accent)", border:"none", borderRadius:7, color:"#060c18", fontWeight:700, fontSize:13, cursor:"pointer" }}>Save</button>
                      <button onClick={()=>setEditingDisb(false)} style={{ padding:"7px 16px", background:"var(--border)", border:"none", borderRadius:7, color:"var(--text)", fontSize:13, cursor:"pointer" }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display:"flex", gap:20, fontSize:13 }}>
                    <div>Status: <span style={{ color:c.disbursed?"var(--green)":"var(--amber)", fontWeight:600 }}>{c.disbursed?"Disbursed":"Pending"}</span></div>
                    {c.disbursed && <div>Amount: <span style={{ color:"var(--accent)", fontWeight:600 }}>{fmtShort(c.disbursedAmt)}</span></div>}
                    {c.disbursedDate && <div>Date: <span style={{ color:"var(--text-muted)" }}>{fmtDate(c.disbursedDate)}</span></div>}
                  </div>
                )}
              </div>
            )}

            {c.driveLink && (
              <a href={c.driveLink} target="_blank" rel="noreferrer"
                style={{ display:"inline-flex", alignItems:"center", gap:8, background:"var(--bg-deep)", border:"1px solid var(--border)", borderRadius:10, padding:"10px 16px", color:"var(--accent2)", fontSize:13, textDecoration:"none", marginBottom:14 }}>
                <ExternalLink size={14} /> View Docs on Google Drive →
              </a>
            )}

            {c.remarks && (
              <div style={{ background:"var(--bg-deep)", borderRadius:8, padding:"10px 14px", fontSize:13, color:"var(--text-muted)", marginBottom:14, display:"flex", alignItems:"flex-start", gap:8 }}>
                <FileText size={14} style={{ color:"var(--accent)", marginTop:2, flexShrink:0 }} />
                <span>{c.remarks}</span>
              </div>
            )}

            {onEdit && <Btn variant="primary" onClick={onEdit}><Pencil size={13} style={{ marginRight:6 }} /> Edit Case</Btn>}
          </>
        )}

        {/* SLOTS (Net) */}
        {activeTab === "slots" && isNet && (
          <div>
            <div style={{ fontWeight:600, fontSize:13, marginBottom:12, color:"var(--text-muted)" }}>
              {(c.slots||[]).filter(s=>s.disbursed).length}/{c.totalSlots||"?"} slots disbursed
              <span style={{ marginLeft:8, fontSize:11, color:"var(--text-faint)" }}>
                Dev mode: {c.devPayoutMode==="lump_sum"?"Lump sum at end":"Per slot"}
              </span>
            </div>
            {(c.slots||[]).map((s, i) => (
              <div key={i} style={{ background:s.disbursed?"#00d4a108":"var(--bg-deep)", border:`1px solid ${s.disbursed?"#00d4a130":"var(--border)"}`, borderRadius:10, padding:"12px 16px", marginBottom:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:28, height:28, borderRadius:"50%", background:s.disbursed?"var(--accent)":"var(--border)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:s.disbursed?"#060c18":"var(--text-faint)", flexShrink:0 }}>
                    {i+1}
                  </div>
                  <div style={{ flex:1 }}>
                    {editSlotIdx === i ? (
                      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                        <input type="number" value={editSlotAmt} onChange={e=>setEditSlotAmt(e.target.value)}
                          style={{ width:140, padding:"5px 8px", fontSize:13 }} placeholder="Slot amount ₹" />
                        <button onClick={()=>saveSlotAmt(i)} style={{ padding:"5px 12px", background:"var(--accent)", border:"none", borderRadius:6, color:"#060c18", fontWeight:700, fontSize:12, cursor:"pointer" }}>Save</button>
                        <button onClick={()=>setEditSlotIdx(null)} style={{ padding:"5px 10px", background:"var(--border)", border:"none", borderRadius:6, color:"var(--text)", fontSize:12, cursor:"pointer", display:"inline-flex", alignItems:"center" }}><X size={12} /></button>
                      </div>
                    ) : (
                      <div>
                        <span style={{ fontWeight:600, fontSize:13 }}>Slot {i+1} — {fmtShort(s.customAmt||0)}</span>
                        {onUpdateSlot && (
                          <button onClick={()=>{ setEditSlotIdx(i); setEditSlotAmt(s.customAmt||""); }}
                            title="Edit slot amount"
                            style={{ marginLeft:8, background:"none", border:"none", color:"var(--text-faint)", cursor:"pointer", display:"inline-flex", alignItems:"center", verticalAlign:"middle" }}>
                            <Pencil size={11} />
                          </button>
                        )}
                      </div>
                    )}
                    <div style={{ fontSize:11, color:"var(--text-faint)", marginTop:2 }}>
                      {s.disbursedOn && `Disbursed: ${fmtDate(s.disbursedOn)}`}
                      {s.bankPaidOn  && ` · Bank paid: ${fmtDate(s.bankPaidOn)}`}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                    {onUpdateSlot && !s.disbursed && (
                      <Btn size="sm" variant="primary" onClick={()=>onUpdateSlot(c,i,"disbursed",true)}>Mark Disbursed</Btn>
                    )}
                    {s.disbursed && !s.bankPaid && onUpdateSlot && (
                      <Btn size="sm" onClick={()=>onUpdateSlot(c,i,"bankPaid",true)}><Check size={12} style={{ marginRight:4 }} /> Bank Paid</Btn>
                    )}
                    {s.disbursed && s.bankPaid && (
                      <span className="tag" style={{ background:"#10b98120", color:"#34d399", display:"inline-flex", alignItems:"center", gap:4 }}>
                        <Check size={11} /> Bank Paid
                      </span>
                    )}
                    {s.disbursed && !s.bankPaid && (
                      <span className="tag" style={{ background:"#f59e0b20", color:"#fbbf24" }}>Awaiting Bank</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LOGS */}
        {activeTab === "logs" && (
          <div>
            <div style={{ fontWeight:600, fontSize:13, marginBottom:12, color:"var(--text-muted)" }}>Activity Log</div>
            {logsLoading
              ? <div style={{ textAlign:"center", padding:30, color:"var(--text-faint)" }}>Loading…</div>
              : logs.length === 0
                ? <div style={{ textAlign:"center", padding:30, color:"var(--text-faint)", fontSize:13 }}>No activity yet.</div>
                : logs.map((log, i) => (
                  <div key={i} style={{ display:"flex", gap:10, padding:"10px 0", borderBottom:"1px solid var(--border-lt)" }}>
                    <div style={{ width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg,#00d4a1,#0088ff)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#060c18", flexShrink:0 }}>
                      {(log.userName||"?")[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize:13 }}><span style={{ fontWeight:600, color:"var(--accent)" }}>{log.userName}</span> {log.action}</div>
                      <div style={{ fontSize:11, color:"var(--text-dim)", marginTop:2 }}>
                        {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString("en-IN") : "—"}
                      </div>
                    </div>
                  </div>
                ))
            }
          </div>
        )}

        <button onClick={onClose} style={{ marginTop:20, width:"100%", background:"var(--border)", border:"none", color:"var(--text)", borderRadius:8, padding:"10px 0", fontSize:13, cursor:"pointer" }}>
          Close
        </button>
      </div>
    </div>
  );
}

// ─── small helpers ────────────────────────────────────────────────────────────

function SL({ children, style }) {
  return <div style={{ fontSize:11, fontWeight:700, color:"var(--text-faint)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10, ...style }}>{children}</div>;
}
function PLItem({ label, value, color, neg, bold }) {
  return (
    <div>
      <div style={{ fontSize:11, color:"var(--text-faint)", marginBottom:2 }}>{label}</div>
      <div style={{ fontWeight:bold?700:600, color, fontSize:bold?16:14 }}>{neg?"−":""}{fmtShort(value)}</div>
    </div>
  );
}
function RevRow({ label, value, color, neg }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:6 }}>
      <span style={{ color:"var(--text-faint)" }}>{label}</span>
      <span style={{ fontWeight:600, color }}>{neg?"−":"+"}{fmtShort(value)}</span>
    </div>
  );
}

