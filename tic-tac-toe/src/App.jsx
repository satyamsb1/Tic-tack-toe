import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import Onboarding from "./pages/Onboarding";
import Lobby from "./pages/Lobby";
import Event from "./pages/Event";
import "./index.css";

function Protected({ children }) {
  const { user } = useApp();
  if (!user.name) return <Navigate to="/" replace />;
  return children;
}

function Shell({ children }) {
  const { user, clearAll } = useApp();
  return (
    <div style={{ maxWidth: 960, margin: "32px auto", padding: "0 16px" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}>
        <Link
          to="/lobby"
          style={{ textDecoration: "none", fontWeight: 800, fontSize: 18 }}>
          🎮 Multi-Session Demo
        </Link>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {user.name && (
            <span>
              Hi, <strong>{user.name}</strong>
            </span>
          )}
          <button className="history-btn" onClick={clearAll}>
            Reset App
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Shell>
          <Routes>
            <Route path="/" element={<Onboarding />} />
            <Route
              path="/lobby"
              element={
                <Protected>
                  <Lobby />
                </Protected>
              }
            />
            <Route
              path="/event/:roomId"
              element={
                <Protected>
                  <Event />
                </Protected>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Shell>
      </BrowserRouter>
    </AppProvider>
  );
}
