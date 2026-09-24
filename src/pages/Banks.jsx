import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import {
  SectionHeader, Btn, FormField, FormPanel, EmptyState, Modal, DetailGrid, DatePicker,
} from "../components/UI";
import { fmtDate } from "../utils/helpers";

const BLANK_BANK = { name:"", agreementType:"Gross", agreementPct:"", agreementDate:"", agreementFile:"", driveLink:"", remarks:"" };
const BLANK_POC  = { name:"", role:"", phone:"", email:"" };

export default function Banks() {
  const { banks, saveBank, removeBank, cases, openModal, closeModal, modal, loading } = useApp();
  const { canEdit } = useAuth();

  const [showAdd,  setShowAdd]  = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState(BLANK_BANK);
  const [pocs,     setPocs]     = useState([{ ...BLANK_POC }]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const f  = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const pf = (idx, k) => (e) => setPocs(prev => prev.map((poc, i) => i === idx ? { ...poc, [k]: e.target.value } : poc));

  const startEdit = (bank) => {
    setEditId(bank.id);
    setForm({
      name: bank.name, agreementType: bank.agreementType, agreementPct: bank.agreementPct,
      agreementDate: bank.agreementDate || "", agreementFile: bank.agreementFile || "",
      driveLink: bank.driveLink || "", remarks: bank.remarks || "",
    });
    setPocs(bank.contacts?.length ? bank.contacts : [{ ...BLANK_POC }]);
    setShowAdd(false); closeModal();
  };

  const handleSave = async () => {
    if (!form.name) return alert("Bank name is required.");
    setSaving(true);
    await saveBank({
      ...form, logo:"🏦",
      agreementPct: parseFloat(form.agreementPct) || 0,
      contacts: pocs.filter(p => p.name),
    }, editId || null);
    setSaving(false);
    setForm(BLANK_BANK); setPocs([{ ...BLANK_POC }]);
    setShowAdd(false); setEditId(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await removeBank(deleteTarget.id);
    setDeleting(false); setDeleteTarget(null); closeModal();
  };

  const viewBank = (bank) => {
    const bankCases = cases.filter(c => c.bankId === bank.id);
    openModal(
      <div>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
          <span style={{ fontSize:32 }}>🏦</span>
          <div>
            <div style={{ fontFamily:"var(--font-head)", fontSize:20, fontWeight:700 }}>{bank.name}</div>
            <div style={{ display:"flex", gap:8, marginTop:4 }}>
              <span className="tag" style={{ background:bank.agreementType==="Gross"?"#00d4a120":"#6366f120", color:bank.agreementType==="Gross"?"var(--accent)":"#818cf8" }}>
                {bank.agreementType}
              </span>
              <span className="tag" style={{ background:"#00d4a120", color:"var(--accent)" }}>{bank.agreementPct}% Commission</span>
            </div>
          </div>
        </div>
        <DetailGrid items={[
          ["Agreement Date",  fmtDate(bank.agreementDate)],
          ["Agreement File",  bank.agreementFile || "—"],
          ["Total Cases",     bankCases.length],
          ["Disbursed Cases", bankCases.filter(c => c.disbursed).length],
        ]} />
        {bank.driveLink && (
          <a href={bank.driveLink} target="_blank" rel="noreferrer"
            style={{ display:"inline-flex", alignItems:"center", gap:8, background:"var(--bg-deep)", border:"1px solid var(--border)", borderRadius:10, padding:"10px 16px", color:"var(--accent2)", fontSize:13, textDecoration:"none", marginBottom:16 }}>
            📎 View Agreement on Google Drive →
          </a>
        )}
        {bank.remarks && (
          <div style={{ background:"var(--bg-deep)", borderRadius:8, padding:"10px 14px", fontSize:13, color:"var(--text-muted)", marginBottom:16 }}>
            📝 {bank.remarks}
          </div>
        )}
        <div style={{ fontWeight:600, fontSize:13, color:"var(--text-muted)", marginBottom:10 }}>
          Points of Contact ({(bank.contacts||[]).length})
        </div>
        {(bank.contacts||[]).map((c, i) => (
          <div key={i} style={{ background:"var(--bg-deep)", border:"1px solid var(--border)", borderRadius:10, padding:14, marginBottom:10 }}>
            <div style={{ fontWeight:600, fontSize:14, marginBottom:4 }}>{c.name}</div>
            <div style={{ fontSize:12, color:"var(--text-faint)", marginBottom:6 }}>{c.role}</div>
            <div style={{ display:"flex", gap:16, fontSize:12 }}>
              {c.phone && <span>📞 {c.phone}</span>}
              {c.email && <span>✉️ {c.email}</span>}
            </div>
          </div>
        ))}
        {canEdit && (
          <div style={{ display:"flex", gap:10, marginTop:16 }}>
            <Btn variant="primary" onClick={() => startEdit(bank)}>✏️ Edit Bank</Btn>
            <Btn variant="danger"  onClick={() => { closeModal(); setDeleteTarget(bank); }}>🗑️ Delete Bank</Btn>
          </div>
        )}
      </div>
    );
  };

  const isEditing = showAdd || !!editId;

  return (
    <div>
      <SectionHeader
        title="Banks & Agreements"
        sub="Partner banks, POC contacts, and commission agreements"
        action={canEdit && !isEditing && (
          <Btn variant="primary" onClick={() => { setShowAdd(true); setEditId(null); setForm(BLANK_BANK); setPocs([{...BLANK_POC}]); }}>
            + Add Bank
          </Btn>
        )}
      />

      {isEditing && canEdit && (
        <FormPanel
          title={editId ? "Edit Bank" : "New Bank"}
          onSave={handleSave}
          onCancel={() => { setShowAdd(false); setEditId(null); }}
          saveLabel={saving ? "Saving…" : "Save Bank"}
        >
          <div className="grid-3" style={{ marginBottom:16 }}>
            <FormField label="Bank Name" span={2}><input value={form.name} onChange={f("name")} placeholder="e.g. HDFC Bank" /></FormField>
            <FormField label="Agreement Type">
              <select value={form.agreementType} onChange={f("agreementType")}>
                <option>Gross</option><option>Net</option>
              </select>
            </FormField>
            <FormField label="Commission %"><input type="number" step="0.01" value={form.agreementPct} onChange={f("agreementPct")} placeholder="0.50" /></FormField>
            <FormField label="Agreement Date"><DatePicker value={form.agreementDate} onChange={f("agreementDate")} /></FormField>
            <FormField label="Agreement File Name"><input value={form.agreementFile} onChange={f("agreementFile")} placeholder="Agreement_2024.pdf" /></FormField>
            <FormField label="Google Drive Link (Agreement PDF)" span={2}>
              <input value={form.driveLink} onChange={f("driveLink")} placeholder="https://drive.google.com/..." />
            </FormField>
            <FormField label="Remarks" span={3}><textarea rows={2} value={form.remarks} onChange={f("remarks")} /></FormField>
          </div>

          <div style={{ borderTop:"1px solid var(--border-lt)", paddingTop:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div style={{ fontWeight:600, fontSize:13, color:"var(--text-muted)" }}>Points of Contact</div>
              <Btn size="sm" onClick={() => setPocs(prev => [...prev, { ...BLANK_POC }])}>+ Add POC</Btn>
            </div>
            {pocs.map((poc, idx) => (
              <div key={idx} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr auto", gap:10, marginBottom:10, alignItems:"end" }}>
                <FormField label="Name"><input value={poc.name} onChange={pf(idx,"name")} /></FormField>
                <FormField label="Role"><input value={poc.role} onChange={pf(idx,"role")} /></FormField>
                <FormField label="Phone"><input value={poc.phone} onChange={pf(idx,"phone")} /></FormField>
                <FormField label="Email"><input type="email" value={poc.email} onChange={pf(idx,"email")} /></FormField>
                {pocs.length > 1 && (
                  <button onClick={() => setPocs(prev => prev.filter((_,i)=>i!==idx))}
                    style={{ background:"#ef444420", border:"1px solid #ef444440", borderRadius:6, color:"#f87171", padding:"6px 10px", cursor:"pointer", marginBottom:2 }}>✕</button>
                )}
              </div>
            ))}
          </div>
        </FormPanel>
      )}

      {loading
        ? <div style={{ textAlign:"center", padding:60, color:"var(--text-faint)" }}>Loading…</div>
        : banks.length === 0
          ? <EmptyState icon="🏦" message="No banks added yet." />
          : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:16 }}>
              {banks.map(b => (
                <div key={b.id} className="card" style={{ padding:22, cursor:"pointer" }} onClick={() => viewBank(b)}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
                    <span style={{ fontSize:30 }}>🏦</span>
                    <span className="tag" style={{ background:b.agreementType==="Gross"?"#00d4a120":"#6366f120", color:b.agreementType==="Gross"?"var(--accent)":"#818cf8" }}>
                      {b.agreementType}
                    </span>
                  </div>
                  <div style={{ fontFamily:"var(--font-head)", fontSize:18, fontWeight:700, marginBottom:3 }}>{b.name}</div>
                  <div style={{ fontSize:12, color:"var(--text-faint)", marginBottom:16 }}>
                    {(b.contacts||[]).length} POC{(b.contacts||[]).length!==1?"s":""} · {cases.filter(c=>c.bankId===b.id).length} cases
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
                    <div>
                      <div style={{ fontFamily:"var(--font-head)", fontSize:26, fontWeight:700, color:"var(--accent)", lineHeight:1 }}>{b.agreementPct}%</div>
                      <div style={{ fontSize:11, color:"var(--text-faint)" }}>Commission ({b.agreementType})</div>
                    </div>
                    {canEdit && (
                      <button onClick={e => { e.stopPropagation(); setDeleteTarget(b); }}
                        style={{ background:"#ef444420", border:"1px solid #ef444440", borderRadius:6, color:"#f87171", fontSize:11, padding:"4px 10px", cursor:"pointer" }}>
                        🗑️
                      </button>
                    )}
                  </div>
                  {b.driveLink && <div style={{ marginTop:10, fontSize:11, color:"var(--accent2)" }}>📎 Drive linked</div>}
                </div>
              ))}
            </div>
          )
      }

      {modal && <Modal onClose={closeModal}>{modal.content}</Modal>}

      {deleteTarget && (
        <div className="overlay" onClick={() => setDeleteTarget(null)}>
          <div style={{ background:"var(--bg-card)", border:"1px solid #ef444450", borderRadius:16, padding:28, maxWidth:400, width:"90%" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:32, marginBottom:12 }}>🗑️</div>
            <div style={{ fontFamily:"var(--font-head)", fontSize:18, fontWeight:700, marginBottom:8 }}>Delete: {deleteTarget.name}?</div>
            <div style={{ fontSize:13, color:"var(--text-faint)", marginBottom:24, lineHeight:1.6 }}>
              This will permanently delete the bank. Cases linked to this bank will lose their bank reference.
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={handleDelete} disabled={deleting}
                style={{ flex:1, padding:"11px 0", background:"#ef4444", border:"none", borderRadius:9, color:"#fff", fontWeight:700, fontSize:14, cursor:"pointer" }}>
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
              <button onClick={() => setDeleteTarget(null)}
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
