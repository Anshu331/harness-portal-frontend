import { useContext } from "react";
import { AuthContext } from "../authContext.jsx";

export default function DashboardLayout({ title, children }) {
  const { user, logout } = useContext(AuthContext);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="dash-header">
        <h1 className="dash-header__title">{title}</h1>
        <div className="dash-header__actions">
          <span className="dash-header__role">{user}</span>
          <button type="button" className="btn btn--secondary" onClick={logout}>
            Logout
          </button>
        </div>
      </header>
      <main className="dash-main">{children}</main>
    </div>
  );
}
