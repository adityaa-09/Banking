import {
  collection, doc, getDocs, addDoc, setDoc,
  updateDoc, deleteDoc, query, where, orderBy,
  serverTimestamp, limit,
} from "firebase/firestore";
import { db } from "./firebase";

const col   = (name) => collection(db, name);
const docR  = (name, id) => doc(db, name, id);
const toData = (snap) => snap.docs.map(d => ({ id: d.id, ...d.data() }));

// ── USERS ─────────────────────────────────────────────────────────────────────
export const getUsers = async () => toData(await getDocs(col("users")));
export const getUserByUsername = async (username) => {
  const snap = await getDocs(query(col("users"), where("username", "==", username)));
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
};
export const createUser = async (data) => { const r = await addDoc(col("users"), { ...data, createdAt: serverTimestamp() }); return r.id; };
export const updateUser = async (id, data) => updateDoc(docR("users", id), { ...data, updatedAt: serverTimestamp() });
export const deleteUser = async (id) => deleteDoc(docR("users", id));
export const seedAdminIfEmpty = async () => {
  const users = await getUsers();
  if (users.length === 0) {
    await setDoc(doc(db, "users", "admin-default"), {
      username: "admin", password: "admin123",
      name: "Super Admin", role: "admin",
      email: "admin@beyondwalls.com", phone: "", active: true,
      createdAt: serverTimestamp(),
    });
  }
};

// ── PROJECTS ──────────────────────────────────────────────────────────────────
export const getProjects   = async () => toData(await getDocs(col("projects")));
export const addProject    = async (data) => { const r = await addDoc(col("projects"), { ...data, createdAt: serverTimestamp() }); return r.id; };
export const updateProject = async (id, data) => updateDoc(docR("projects", id), { ...data, updatedAt: serverTimestamp() });
export const deleteProject = async (id) => deleteDoc(docR("projects", id));

// ── BANKS ─────────────────────────────────────────────────────────────────────
export const getBanks   = async () => toData(await getDocs(col("banks")));
export const addBank    = async (data) => { const r = await addDoc(col("banks"), { ...data, createdAt: serverTimestamp() }); return r.id; };
export const updateBank = async (id, data) => updateDoc(docR("banks", id), { ...data, updatedAt: serverTimestamp() });
export const deleteBank = async (id) => deleteDoc(docR("banks", id));

// ── APF ───────────────────────────────────────────────────────────────────────
export const getApfs   = async () => toData(await getDocs(col("apfs")));
export const addApf    = async (data) => { const r = await addDoc(col("apfs"), { ...data, createdAt: serverTimestamp() }); return r.id; };
export const updateApf = async (id, data) => updateDoc(docR("apfs", id), { ...data, updatedAt: serverTimestamp() });
export const deleteApf = async (id) => deleteDoc(docR("apfs", id));

// ── CASES ─────────────────────────────────────────────────────────────────────
export const getCases   = async () => toData(await getDocs(col("cases")));
export const addCase    = async (data) => { const r = await addDoc(col("cases"), { ...data, createdAt: serverTimestamp() }); return r.id; };
export const updateCase = async (id, data) => updateDoc(docR("cases", id), { ...data, updatedAt: serverTimestamp() });
export const deleteCase = async (id) => deleteDoc(docR("cases", id));

// ── ACTIVITY LOGS ─────────────────────────────────────────────────────────────
export const addLog = async (data) => {
  await addDoc(col("logs"), { ...data, timestamp: serverTimestamp() });
};
export const getLogsForCase = async (caseId) => {
  const snap = await getDocs(
    query(col("logs"), where("caseId", "==", caseId), orderBy("timestamp", "desc"))
  );
  return toData(snap);
};
export const getRecentLogs = async (limitN = 50) => {
  const snap = await getDocs(
    query(col("logs"), orderBy("timestamp", "desc"), limit(limitN))
  );
  return toData(snap);
};
