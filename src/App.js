import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import Layout        from "./components/Layout";
import Login         from "./pages/Login";
import Dashboard     from "./pages/Dashboard";
import Projects      from "./pages/Projects";
import Banks         from "./pages/Banks";
import APFNumbers    from "./pages/APFNumbers";
import Cases         from "./pages/Cases";
import Revenue       from "./pages/Revenue";
import UserReport    from "./pages/UserReport";
import UserManagement from "./pages/admin/UserManagement";
import ActivityLog    from "./pages/ActivityLog";
import ExportBackup   from "./pages/ExportBackup";

const PAGES = {
  dashboard:  Dashboard,
  projects:   Projects,
  banks:      Banks,
  apf:        APFNumbers,
  cases:      Cases,
  revenue:    Revenue,
  userreport: UserReport,
  users:      UserManagement,
  activitylog: ActivityLog,
  exportbackup: ExportBackup,
};

function AppShell() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (loading) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg-base)", color:"var(--text-faint)", fontSize:14 }}>
        Connecting to Firebase…
      </div>
    );
  }
  if (!user) return <Login />;

  const Page = PAGES[activeTab] || Dashboard;
  return (
    <AppProvider>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        <Page />
      </Layout>
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
