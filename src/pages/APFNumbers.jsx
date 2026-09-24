import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import {
  SectionHeader, Btn, StatusTag, FormField, FormPanel,
  EmptyState, TableCard, FilterSelect, Modal, DetailGrid, DatePicker,
} from "../components/UI";
import { fmtShort, fmtDate } from "../utils/helpers";

const BLANK = { projectId:"", bankId:"", apfNumber:"", approvedAmt:"", validTill:"", approvedOn:"", status:"Active", remarks:"" };

export default function APFNumbers() {
  const { apfs, saveApf, removeApf, projects, banks, openModal, closeModal, modal, loading } = useApp();
  const { canEdit } = useAuth();

  const [showAdd,  setShowAdd]  = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState(BLANK);
  const [filterProject, setFilterProject] = useState("");
  const [filterBank,    setFilterBank]    = useState("");
  const [filterStatus,  setFilterStatus]  = useState("");
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [deleting,      setDeleting]      = useState(false);

  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const startEdit = (a) => {
    setEditData(a);
    setForm({
      projectId: a.projectId, bankId: a.bankId, apfNumber: a.apfNumber,
      approvedAmt: a.approvedAmt || "", validTill: a.validTill || "",
      approvedOn: a.approvedOn || "", status: a.status, remarks: a.remarks || "",
    });
    setShowAdd(false); closeModal();
  };

  const handleSave = async () => {
    if (!form.projectId || !form.bankId || !form.apfNumber) return alert("Project, Bank and APF Number are required.");
    setSaving(true);
    await saveApf({ ...form, approvedAmt: Number(form.approvedAmt) }, editData?.id || null);
    setSaving(false);
    setForm(BLANK); setEditData(null); setShowAdd(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await removeApf(deleteTarget.id);
    setDeleting(false); setDeleteTarget(null);
  };

  const viewApf = (a) => {
    const project = projects.find(p => p.id === a.projectId);
    const bank    = banks.find(b => b.id === a.bankId);
    openModal(
      <div>
        <div style={{ fontFamily:"var(--font-head)", fontSize:18, fontWeight:700, marginBottom:4 }}>APF Detail</div>
        <div style={{ fontFamily:"monospace", fontSize:16, color:"var(--accent)", marginBottom:16, background:"var(--bg-deep)", borderRadius:8, padding:"8px 14px" }}>
          {a.apfNumber}
        </div>
        <DetailGrid items={[
          ["Project",         project?.name],
          ["Bank",            bank?.name],
          ["Approved Amount", fmtShort(a.approvedAmt)],
          ["Approved On",     fmtDate(a.approvedOn)],
          ["Valid Till",      fmtDate(a.validTill)],
          ["Status",          a.status],
        ]} />
        {a.remarks && (
          <div style={{ background:"var(--bg-deep)", borderRadius:8, padding:"10px 14px", fontSize:13, color:"var(--text-muted)", marginBottom:16 }}>
            📝 {a.remarks}
          </div>
        )}
        {canEdit && (
          <div style={{ display:"flex", gap:10, marginTop:16 }}>
            <Btn variant="primary" onClick={() => startEdit(a)}>✏️ Edit</Btn>
            <Btn variant="danger"  onClick={() => { closeModal(); setDeleteTarget(a); }}>🗑️ Delete</Btn>
          </div>
        )}
      </div>
    );
  };

  // Project summary cards
  const byProject = {};
  apfs.forEach(a => { byProject[a.projectId] = (byProject[a.projectId]||0)+1; });

  const filtered = apfs.filter(a =>
    (!filterProject || a.projectId === filterProject) &&
    (!filterBank    || a.bankId    === filterBank) &&
    (!filterStatus  || a.status    === filterStatus)
  );

  const isEditing = showAdd || !!editData;

  return (
    <div>
      <SectionHeader
        title="APF Numbers"
        sub="Project-wise and bank-wise APF tracking"
        action={canEdit && !isEditing && (
          <Btn variant="primary" onClick={() => { setShowAdd(true); setEditData(null); setForm(BLANK); }}>+ Add APF</Btn>
        )}
      />

      {/* Project summary pills */}
      {Object.keys(byProject).length > 0 && (
        <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}>
          {projects.filter(p => byProject[p.id]).map(p => (
            <div key={p.id}
              style={{ background:"var(--bg-card)", border:`1px solid ${filterProject===p.id?"var(--accent)":"var(--border)"}`, borderRadius:10, padding:"10px 18px", cursor:"pointer" }}
              onClick={() => setFilterProject(filterProject===p.id?"":p.id)}>
              <div style={{ fontSize:11, color:"var(--text-faint)", marginBottom:2 }}>{p.developer}</div>
              <div style={{ fontSize:13, fontWeight:600 }}>{p.name}</div>
              <div style={{ fontSize:20, fontWeight:700, color:"var(--accent)", fontFamily:"var(--font-head)" }}>{byProject[p.id]}</div>
              <div style={{ fontSize:11, color:"var(--text-faint)" }}>APF entries</div>
            </div>
          ))}
        </div>
      )}

      {isEditing && canEdit && (
        <FormPanel
          title={editData ? "Edit APF Entry" : "New APF Entry"}
          onSave={handleSave}
          onCancel={() => { setShowAdd(false); setEditData(null); setForm(BLANK); }}
          saveLabel={saving ? "Saving…" : "Save APF"}
        >
          <div className="grid-3">
            <FormField label="Project" span={2}>
              <select value={form.projectId} onChange={f("projectId")}>
                <option value="">Select Project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </FormField>
            <FormField label="Bank">
              <select value={form.bankId} onChange={f("bankId")}>
                <option value="">Select Bank</option>
                {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </FormField>
            <FormField label="APF Number" span={2}><input value={form.apfNumber} onChange={f("apfNumber")} placeholder="HDFC/APF/2024/001" /></FormField>
            <FormField label="Approved Amount (₹)"><input type="number" value={form.approvedAmt} onChange={f("approvedAmt")} /></FormField>
            <FormField label="Approved On"><DatePicker value={form.approvedOn} onChange={f("approvedOn")} /></FormField>
            <FormField label="Valid Till"><DatePicker value={form.validTill} onChange={f("validTill")} /></FormField>
            <FormField label="Status">
              <select value={form.status} onChange={f("status")}>
                <option>Active</option><option>Expired</option><option>Pending</option>
              </select>
            </FormField>
            <FormField label="Remarks" span={3}><textarea rows={2} value={form.remarks} onChange={f("remarks")} /></FormField>
          </div>
        </FormPanel>
      )}

      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
        <FilterSelect value={filterProject} onChange={setFilterProject} placeholder="All Projects" options={projects.map(p=>[p.id,p.name])} />
        <FilterSelect value={filterBank}    onChange={setFilterBank}    placeholder="All Banks"    options={banks.map(b=>[b.id,b.name])} />
        <FilterSelect value={filterStatus}  onChange={setFilterStatus}  placeholder="All Status"   options={[["Active","Active"],["Expired","Expired"],["Pending","Pending"]]} />
        <div style={{ marginLeft:"auto", fontSize:13, color:"var(--text-faint)" }}>{filtered.length} records</div>
      </div>

      {loading
        ? <div style={{ textAlign:"center", padding:60, color:"var(--text-faint)" }}>Loading…</div>
        : filtered.length === 0
          ? <EmptyState message="No APF records found." />
          : (
            <TableCard>
              <table>
                <thead>
                  <tr><th>APF Number</th><th>Project</th><th>Bank</th><th>Approved Amt</th><th>Approved On</th><th>Valid Till</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {filtered.map(a => {
                    const project = projects.find(p=>p.id===a.projectId);
                    const bank    = banks.find(b=>b.id===a.bankId);
                    return (
                      <tr key={a.id} onClick={()=>viewApf(a)} style={{ cursor:"pointer" }}>
                        <td><span style={{ fontFamily:"monospace", fontSize:12, color:"var(--accent)" }}>{a.apfNumber}</span></td>
                        <td>
                          <div style={{ fontSize:13 }}>{project?.name}</div>
                          <div style={{ fontSize:11, color:"var(--text-faint)" }}>{project?.location}</div>
                        </td>
                        <td>{bank?.logo} {bank?.name}</td>
                        <td style={{ color:"var(--accent2)", fontWeight:600 }}>{fmtShort(a.approvedAmt)}</td>
                        <td style={{ color:"var(--text-muted)" }}>{fmtDate(a.approvedOn)}</td>
                        <td style={{ color:a.status==="Expired"?"var(--red)":"var(--text-muted)" }}>{fmtDate(a.validTill)}</td>
                        <td><StatusTag status={a.status} /></td>
                        <td onClick={e=>e.stopPropagation()}>
                          {canEdit && (
                            <button onClick={()=>setDeleteTarget(a)}
                              style={{ background:"#ef444420", border:"1px solid #ef444440", borderRadius:6, color:"#f87171", fontSize:11, padding:"4px 10px", cursor:"pointer" }}>
                              🗑️
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableCard>
          )
      }

      {modal && <Modal onClose={closeModal}>{modal.content}</Modal>}

      {deleteTarget && (
        <div className="overlay" onClick={()=>setDeleteTarget(null)}>
          <div style={{ background:"var(--bg-card)", border:"1px solid #ef444450", borderRadius:16, padding:28, maxWidth:400, width:"90%" }}
            onClick={e=>e.stopPropagation()}>
            <div style={{ fontSize:32, marginBottom:12 }}>🗑️</div>
            <div style={{ fontFamily:"var(--font-head)", fontSize:18, fontWeight:700, marginBottom:8 }}>Delete APF: {deleteTarget.apfNumber}?</div>
            <div style={{ fontSize:13, color:"var(--text-faint)", marginBottom:24 }}>This APF entry will be permanently deleted.</div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={handleDelete} disabled={deleting}
                style={{ flex:1, padding:"11px 0", background:"#ef4444", border:"none", borderRadius:9, color:"#fff", fontWeight:700, fontSize:14, cursor:"pointer" }}>
                {deleting?"Deleting…":"Yes, Delete"}
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
