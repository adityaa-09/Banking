import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  getProjects, addProject, updateProject, deleteProject,
  getBanks,    addBank,    updateBank,    deleteBank,
  getApfs,     addApf,     updateApf,    deleteApf,
  getCases,    addCase,    updateCase,    deleteCase,
  getUsers,    createUser, updateUser,   deleteUser,
  addLog, getLogsForCase, getRecentLogs,
} from "../config/firebaseService";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [banks,    setBanks]    = useState([]);
  const [apfs,     setApfs]     = useState([]);
  const [cases,    setCases]    = useState([]);
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [p, b, a, c, u] = await Promise.all([
        getProjects(), getBanks(), getApfs(), getCases(), getUsers(),
      ]);
      setProjects(p); setBanks(b); setApfs(a); setCases(c); setUsers(u);
    } catch (e) { console.error("Load failed:", e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const saveProject  = async (data, id) => { id ? await updateProject(id, data) : await addProject(data); await loadAll(); };
  const removeProject = async (id) => { await deleteProject(id); await loadAll(); };
  const saveBank     = async (data, id) => { id ? await updateBank(id, data)    : await addBank(data);    await loadAll(); };
  const removeBank   = async (id) => { await deleteBank(id); await loadAll(); };
  const saveApf      = async (data, id) => { id ? await updateApf(id, data)     : await addApf(data);     await loadAll(); };
  const removeApf    = async (id) => { await deleteApf(id); await loadAll(); };

  const saveCase = async (data, id) => {
    if (id) { await updateCase(id, data); }
    else     { await addCase(data); }
    await loadAll();
  };
  const removeCase = async (id) => { await deleteCase(id); await loadAll(); };

  const saveUser   = async (data, id) => { id ? await updateUser(id, data) : await createUser(data); await loadAll(); };
  const removeUser = async (id) => { await deleteUser(id); await loadAll(); };

  const fetchCaseLogs   = (caseId) => getLogsForCase(caseId);
  const fetchRecentLogs = (n) => getRecentLogs(n);
  const writeLog = (entry) => addLog(entry);

  const openModal  = (content) => setModal({ content });
  const closeModal = () => setModal(null);

  return (
    <AppContext.Provider value={{
      projects, banks, apfs, cases, users, loading, loadAll,
      saveProject, removeProject,
      saveBank, removeBank, saveApf, removeApf, saveCase, removeCase,
      saveUser, removeUser,
      fetchCaseLogs, fetchRecentLogs, writeLog,
      modal, openModal, closeModal,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
