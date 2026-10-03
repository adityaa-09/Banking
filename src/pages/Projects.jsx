import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import {
  SectionHeader, Btn, StatusTag, FormField, FormPanel,
  EmptyState, Modal, DetailGrid, DatePicker,
} from "../components/UI";
import { fmtDate } from "../utils/helpers";
import { MapPin, Building, Trash2, Sparkles, FileText, Pencil } from "lucide-react";

const BLANK = {
  name: "", developer: "", location: "", type: "Residential",
  status: "Active", totalUnits: "", launchDate: "",
  developerPayoutPct: "", notes: "",
};

export default function Projects() {
  const { projects, saveProject, removeProject, apfs, cases, openModal, closeModal, modal, loading } = useApp();
  const { canEdit } = useAuth();

  const [showAdd,   setShowAdd]   = useState(false);
  const [editData,  setEditData]  = useState(null);
  const [form,      setForm]      = useState(BLANK);
  const [saving,    setSaving]    = useState(false);
  const [search,    setSearch]    = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,  setDeleting]  = useState(false);

  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const startEdit = (p) => {
    setEditData(p);
    setForm({
      name: p.name, developer: p.developer, location: p.location,
      type: p.type, status: p.status, totalUnits: p.totalUnits || "",
      launchDate: p.launchDate || "", developerPayoutPct: p.developerPayoutPct || "",
      notes: p.notes || "",
    });
    setShowAdd(false); closeModal();
  };

  const handleSave = async () => {
    if (!form.name || !form.developer) return alert("Name and Developer are required.");
    setSaving(true);
    await saveProject({
      ...form,
      totalUnits: Number(form.totalUnits) || 0,
      developerPayoutPct: parseFloat(form.developerPayoutPct) || 0,
    }, editData?.id || null);
    setSaving(false);
    setForm(BLANK); setEditData(null); setShowAdd(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await removeProject(deleteTarget.id);
    setDeleting(false); setDeleteTarget(null); closeModal();
  };

  const viewProject = (p) => {
    const pApfs  = (apfs  || []).filter(a => a.projectId === p.id);
    const pCases = (cases || []).filter(c => c.projectId === p.id);
    openModal(
      <div>
        <div style={{ fontFamily:"var(--font-head)", fontSize:20, fontWeight:700, marginBottom:4 }}>{p.name}</div>
        <div style={{ display:"flex", gap:8, marginBottom:20 }}>
          <StatusTag status={p.status} />
          <span className="tag" style={{ background:"#6366f122", color:"#818cf8" }}>{p.type}</span>
        </div>
        <DetailGrid items={[
          ["Developer",         p.developer],
          ["Location",          p.location],
          ["Total Units",       p.totalUnits],
          ["Launch Date",       fmtDate(p.launchDate)],
          ["Developer Payout%", `${p.developerPayoutPct || 0}%`],
          ["APF Entries",       pApfs.length],
          ["Cases",             pCases.length],
        ]} />
        {p.notes && (
          <div style={{ background:"var(--bg-deep)", borderRadius:8, padding:"10px 14px", fontSize:13, color:"var(--text-muted)", marginBottom:16, display:"flex", alignItems:"flex-start", gap:8 }}>
            <FileText size={15} style={{ color:"var(--accent)", marginTop:2, flexShrink:0 }} />
            <span>{p.notes}</span>
          </div>
        )}
        {canEdit && (
          <div style={{ display:"flex", gap:10, marginTop:16 }}>
            <Btn variant="primary" onClick={() => startEdit(p)}><Pencil size={13} style={{ marginRight:6 }} /> Edit</Btn>
            <Btn variant="danger"  onClick={() => { closeModal(); setDeleteTarget(p); }}><Trash2 size={13} style={{ marginRight:6 }} /> Delete</Btn>
          </div>
        )}
      </div>
    );
  };

  const filtered = projects.filter(p =>
    (!filterStatus || p.status === filterStatus) &&
    (!search || p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.developer.toLowerCase().includes(search.toLowerCase()) ||
      (p.location||"").toLowerCase().includes(search.toLowerCase()))
  );

  const isEditing = showAdd || !!editData;

  return (
    <div>
      <SectionHeader
        title="Projects / Mandate List"
        sub="Manage active mandates with developer payout agreements"
        action={canEdit && !isEditing && (
          <Btn variant="primary" onClick={() => { setShowAdd(true); setEditData(null); setForm(BLANK); }}>
            + Add Project
          </Btn>
        )}
      />

      {isEditing && canEdit && (
        <FormPanel
          title={editData ? `Edit: ${editData.name}` : "New Project"}
          onSave={handleSave}
          onCancel={() => { setShowAdd(false); setEditData(null); setForm(BLANK); }}
          saveLabel={saving ? "Saving…" : (editData ? "Update" : "Save Project")}
        >
          <div className="grid-3">
            <FormField label="Project Name" span={2}><input value={form.name} onChange={f("name")} placeholder="e.g. Prestige Skyline" /></FormField>
            <FormField label="Developer"><input value={form.developer} onChange={f("developer")} /></FormField>
            <FormField label="Location"><input value={form.location} onChange={f("location")} /></FormField>
            <FormField label="Type">
              <select value={form.type} onChange={f("type")}>
                <option>Residential</option><option>Commercial</option><option>Mixed</option><option>Affordable</option>
              </select>
            </FormField>
            <FormField label="Status">
              <select value={form.status} onChange={f("status")}>
                <option>Active</option><option>Completed</option><option>On Hold</option>
              </select>
            </FormField>
            <FormField label="Total Units"><input type="number" value={form.totalUnits} onChange={f("totalUnits")} /></FormField>
            <FormField label="Launch Date"><DatePicker value={form.launchDate} onChange={f("launchDate")} /></FormField>
            <FormField label="Developer Payout %">
              <input type="number" step="0.01" value={form.developerPayoutPct} onChange={f("developerPayoutPct")}
                placeholder="e.g. 0.20 (% of loan amount paid to developer)" />
            </FormField>
            <FormField label="Notes / Remarks" span={3}><textarea rows={2} value={form.notes} onChange={f("notes")} /></FormField>
          </div>
          <div style={{ marginTop:10, padding:"10px 14px", background:"var(--bg-deep)", borderRadius:8, fontSize:12, color:"var(--text-faint)", display:"flex", alignItems:"center", gap:8 }}>
            <Sparkles size={14} color="var(--amber)" /> Revenue flow: Bank pays us commission (% on disbursed loan) → We pay developer {form.developerPayoutPct||"Y"}% on loan amount (Gross: total loan, Net: disbursed) → Net Profit = Bank Income − Dev Payout
          </div>
        </FormPanel>
      )}

      {/* Filters */}
      <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap", alignItems:"center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects…" style={{ width:220 }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width:160 }}>
          <option value="">All Status</option>
          <option>Active</option><option>Completed</option><option>On Hold</option>
        </select>
        <div style={{ marginLeft:"auto", fontSize:13, color:"var(--text-faint)" }}>
          {filtered.length} project{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {loading
        ? <div style={{ textAlign:"center", padding:60, color:"var(--text-faint)" }}>Loading…</div>
        : filtered.length === 0
          ? <EmptyState message="No projects found." />
          : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:16 }}>
              {filtered.map(p => (
                <div key={p.id} className="card" style={{ padding:22, cursor:"pointer" }} onClick={() => viewProject(p)}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
                    <span className="tag" style={{ background:"#6366f122", color:"#818cf8" }}>{p.type}</span>
                    <StatusTag status={p.status} />
                  </div>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:3, lineHeight:1.3 }}>{p.name}</div>
                  <div style={{ fontSize:12, color:"var(--text-faint)", marginBottom:14 }}>{p.developer}</div>
                  <div style={{ fontSize:12, color:"var(--text-muted)", marginBottom:12, display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                    <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}><MapPin size={12} color="var(--text-dim)" /> {p.location}</span>
                    <span>·</span>
                    <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}><Building size={12} color="var(--text-dim)" /> {p.totalUnits || "—"} units</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#ec489920", border:"1px solid #ec489940", borderRadius:8, padding:"5px 12px" }}>
                      <span style={{ fontSize:11, color:"#f9a8d4" }}>Dev Payout</span>
                      <span style={{ fontFamily:"var(--font-head)", fontWeight:700, color:"#ec4899", fontSize:15 }}>{p.developerPayoutPct || 0}%</span>
                    </div>
                    {canEdit && (
                      <button onClick={e => { e.stopPropagation(); setDeleteTarget(p); }}
                        style={{ background:"#ef444420", border:"1px solid #ef444440", borderRadius:6, color:"#f87171", fontSize:11, padding:"6px 8px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
      }

      {modal && <Modal onClose={closeModal}>{modal.content}</Modal>}

      {deleteTarget && (
        <div className="overlay" onClick={() => setDeleteTarget(null)}>
          <div style={{ background:"var(--bg-card)", border:"1px solid #ef444450", borderRadius:16, padding:28, maxWidth:400, width:"90%", boxShadow:"0 24px 60px rgba(0,0,0,0.5)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width:48, height:48, borderRadius:12, background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)", display:"flex", alignItems:"center", justifyContent:"center", color:"#f87171", marginBottom:16 }}>
              <Trash2 size={24} />
            </div>
            <div style={{ fontFamily:"var(--font-head)", fontSize:18, fontWeight:700, marginBottom:8 }}>Delete: {deleteTarget.name}?</div>
            <div style={{ fontSize:13, color:"var(--text-faint)", marginBottom:24, lineHeight:1.6 }}>
              This will permanently delete the project. Cases linked to this project will lose their project reference.
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
