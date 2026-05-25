import React, { createContext, useContext, useState, useEffect } from "react";
import { getUserByUsername, seedAdminIfEmpty } from "../config/firebaseService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    seedAdminIfEmpty()
      .then(() => {
        const saved = sessionStorage.getItem("bw_user");
        if (saved) setUser(JSON.parse(saved));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    setError("");
    try {
      const found = await getUserByUsername(username.trim());
      if (!found) { setError("User not found."); return false; }
      if (found.password !== password) { setError("Incorrect password."); return false; }
      if (found.active === false) { setError("Account is disabled. Contact admin."); return false; }
      const session = { id: found.id, name: found.name, username: found.username, role: found.role, email: found.email };
      setUser(session);
      sessionStorage.setItem("bw_user", JSON.stringify(session));
      return true;
    } catch (e) {
      setError("Login failed. Check Firebase config.");
      return false;
    }
  };

  const logout = () => { setUser(null); sessionStorage.removeItem("bw_user"); };

  const isAdmin   = user?.role === "admin";
  const isExec    = user?.role === "executive";
  const isViewer  = user?.role === "viewer";
  const canEdit   = isAdmin || isExec;
  const canManageUsers = isAdmin;

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, isAdmin, isExec, isViewer, canEdit, canManageUsers }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
