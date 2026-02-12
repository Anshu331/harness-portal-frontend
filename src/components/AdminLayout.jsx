import { useContext } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { AuthContext } from "../authContext.jsx";

export default function AdminLayout() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="dash-header">
        <h1 className="dash-header__title">Admin</h1>
        <nav className="dash-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? "dash-nav__link dash-nav__link--active" : "dash-nav__link")}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/users"
            className={({ isActive }) => (isActive ? "dash-nav__link dash-nav__link--active" : "dash-nav__link")}
          >
            Users management
          </NavLink>
          <NavLink
            to="/tracking"
            className={({ isActive }) => (isActive ? "dash-nav__link dash-nav__link--active" : "dash-nav__link")}
          >
            Tracking
          </NavLink>
          <NavLink
            to="/projects"
            className={({ isActive }) => (isActive ? "dash-nav__link dash-nav__link--active" : "dash-nav__link")}
          >
            Projects
          </NavLink>
          <NavLink
            to="/vendors"
            className={({ isActive }) => (isActive ? "dash-nav__link dash-nav__link--active" : "dash-nav__link")}
          >
            Vendors
          </NavLink>
          <NavLink
            to="/dvp"
            className={({ isActive }) => (isActive ? "dash-nav__link dash-nav__link--active" : "dash-nav__link")}
          >
            DVP
          </NavLink>
          <NavLink
            to="/tnv"
            className={({ isActive }) => (isActive ? "dash-nav__link dash-nav__link--active" : "dash-nav__link")}
          >
            TNV
          </NavLink>
        </nav>
        <div className="dash-header__actions">
          <span className="dash-header__role">{user}</span>
          <button type="button" className="btn btn--secondary" onClick={logout}>
            Logout
          </button>
        </div>
      </header>
      <main className="dash-main">
        <Outlet />
      </main>
    </div>
  );
}
