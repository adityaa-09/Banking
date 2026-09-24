import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { SectionHeader, Btn, FormField, FormPanel, TableCard } from "../../components/UI";

const BLANK = { name:"", username:"", password:"", email:"", phone:"", role:"executive", active:true };
const ROLE_META = {
  admin:     { label:"Admin",     color:"#ef4444", bg:"#ef444420", desc:"Full access — manage everything including users" },
  executive: { label:"Executive", color:"#00d4a1", bg:"#00d4a120", desc:"Add/edit all data. No user management." },
  finance:   { label:"Finance",   color:"#06b6d4", bg:"#06b6d420", desc:"View all data. Can only update Accounts / Payment Received in cases." },
  viewer:    { label:"Viewer",    color:"#6366f1", bg:"#6366f120", desc:"Read-only — cannot add or edit anything." },
};

export default function UserManagement() {
  const { users, saveUser, removeUser } = useApp();
  const { user: me } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [editId,  setEditId]  = useState(null);
  const [form, setForm]       = useState(BLANK);
  const [saving,  setSaving]  = useState(false);
  const [confirm, setConfirm] = useState(null);

  const f = k => e => setForm({ ...form, [k]: e.target.type==="checkbox" ? e.target.checked : e.target.value });

  const startEdit = u => {
    setEditId(u.id);
    setForm({ name:u.name, username:u.username, password:u.password||"", email:u.email||"", phone:u.phone||"", role:u.role, active:u.active!==false });
    setShowAdd(false);
  };

  const handleSave = async () => {
    if (!form.name || !form.username || (!editId && !form.password)) {
      alert("Name, username and password are required."); return;
    }
    setSaving(true);
    await saveUser({ ...form, active: form.active }, editId||null);
    setSaving(false);
    setEditId(null); setForm(BLANK); setShowAdd(false);
  };

  const handleDelete = async id => {
    if (id === me.id) { alert("You cannot delete yourself."); return; }
    await removeUser(id); setConfirm(null);
  };

  const isEditing = showAdd || !!editId;

  return (
    <div>
      <SectionHeader
        title="User Management"
        sub="Manage admin, executive, and viewer accounts"
        action={!isEditing && <Btn variant="primary" onClick={()=>{ setShowAdd(true); setEditId(null); setForm(BLANK); }}>+ Add User</Btn>}
      />

      {/* Role legend */}
      <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}>
        {Object.entries(ROLE_META).map(([role, m]) => (
          <div key={role} style={{ background:m.bg, border:`1px solid ${m.color}30`, borderRadius:10, padding:"10px 16px", flex:1, minWidth:160 }}>
            <div style={{ fontWeight:700, fontSize:13, color:m.color, marginBottom:4 }}>{m.label}</div>
            <div style={{ fontSize:11, color:"var(--text-faint)" }}>{m.desc}</div>
          </div>
        ))}
      </div>

      {isEditing && (
        <FormPanel
          title={editId ? "Edit User" : "New User"}
          onSave={handleSave}
          onCancel={()=>{ setShowAdd(false); setEditId(null); setForm(BLANK); }}
          saveLabel={saving ? "Saving…" : (editId ? "Update User" : "Create User")}
        >
          <div className="grid-3">
            <FormField label="Full Name" span={2}><input value={form.name} onChange={f("name")} placeholder="e.g. Rahul Sharma" /></FormField>
            <FormField label="Role">
              <select value={form.role} onChange={f("role")}>
                <option value="admin">Admin</option>
                <option value="executive">Executive</option>
                <option value="finance">Finance</option>
                <option value="viewer">Viewer</option>
              </select>
            </FormField>
            <FormField label="Username"><input value={form.username} onChange={f("username")} autoComplete="off" /></FormField>
            <FormField label={editId ? "New Password (blank = keep)" : "Password"}>
              <input type="password" value={form.password} onChange={f("password")} autoComplete="new-password" />
            </FormField>
            <FormField label="Status">
              <select value={form.active ? "yes" : "no"} onChange={e=>setForm({...form, active:e.target.value==="yes"})}>
                <option value="yes">Active</option><option value="no">Disabled</option>
              </select>
            </FormField>
            <FormField label="Email"><input type="email" value={form.email} onChange={f("email")} /></FormField>
            <FormField label="Phone"><input value={form.phone} onChange={f("phone")} /></FormField>
          </div>
        </FormPanel>
      )}

      <TableCard>
        <table>
          <thead>
            <tr><th>Name</th><th>Username</th><th>Role</th><th>Email</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign:"center", color:"var(--text-faint)", padding:40 }}>No users found.</td></tr>
            )}
            {users.map(u => {
              const rm = ROLE_META[u.role] || ROLE_META.viewer;
              const isMe = u.id === me.id;
              return (
                <tr key={u.id}>
                  <td><div style={{ fontWeight:600 }}>{u.name}{isMe && <span style={{ fontSize:10, color:"var(--accent)", marginLeft:6 }}>(you)</span>}</div></td>
                  <td><span style={{ fontFamily:"monospace", color:"var(--accent2)", fontSize:13 }}>{u.username}</span></td>
                  <td><span className="tag" style={{ background:rm.bg, color:rm.color }}>{rm.label}</span></td>
                  <td style={{ fontSize:12, color:"var(--text-muted)" }}>{u.email||"—"}</td>
                  <td><span className="tag" style={{ background:u.active!==false?"#00d4a120":"#ef444420", color:u.active!==false?"var(--accent)":"#f87171" }}>{u.active!==false?"Active":"Disabled"}</span></td>
                  <td>
                    <div style={{ display:"flex", gap:8 }}>
                      <Btn size="sm" onClick={()=>startEdit(u)}>Edit</Btn>
                      {!isMe && (
                        confirm===u.id
                          ? <><Btn size="sm" variant="danger" onClick={()=>handleDelete(u.id)}>Confirm</Btn><Btn size="sm" onClick={()=>setConfirm(null)}>Cancel</Btn></>
                          : <Btn size="sm" variant="danger" onClick={()=>setConfirm(u.id)}>Delete</Btn>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}
