import { Link, Outlet, useLocation } from "react-router-dom";

export default function App() {
  const { pathname } = useLocation();
  return (
    <div>
      <header style={{ background: "#fff", borderBottom: "1px solid #ececf3" }}>
        <div
          style={{
            maxWidth: 960,
            margin: "0 auto",
            padding: "12px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
          <Link to="/" style={{ fontWeight: 700 }}>
            Tic-Tac-Toe Multiplayer
          </Link>
          <nav style={{ display: "flex", gap: 12 }}>
            <Link to="/" style={{ fontWeight: pathname === "/" ? 700 : 400 }}>
              Onboarding
            </Link>
            <Link
              to="/lobby"
              style={{ fontWeight: pathname.startsWith("/lobby") ? 700 : 400 }}>
              Lobby
            </Link>
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
