import { useEffect, useState } from "react";
import API from "../api.js";

const ROLES = [
  { value: "ADMIN", label: "Admin" },
  { value: "DVP", label: "DVP" },
  { value: "TNV", label: "TNV" },
  { value: "VENDOR", label: "Vendor" },
];

export default function UserManagementPage() {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "VENDOR",
    company: "",
  });
  const [userFormError, setUserFormError] = useState("");

  const loadUsers = () =>
    API.get("/auth/users")
      .then((res) => setAllUsers(res.data))
      .catch(() => setAllUsers([]));

  useEffect(() => {
    loadUsers().finally(() => setLoading(false));
  }, []);

  const createUser = async (e) => {
    e.preventDefault();
    setUserFormError("");
    if (!userForm.name.trim() || !userForm.email.trim() || !userForm.password) {
      setUserFormError("Name, email and password are required.");
      return;
    }
    try {
      await API.post("/auth/register", {
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        password: userForm.password,
        role: userForm.role,
        company: userForm.company.trim() || undefined,
      });
      setUserForm({ name: "", email: "", password: "", role: "VENDOR", company: "" });
      loadUsers();
    } catch (err) {
      const msg = err.response?.data ?? err.message ?? "Failed to create user.";
      setUserFormError(typeof msg === "string" ? msg : msg?.message ?? "Failed to create user.");
    }
  };

  if (loading) {
    return <div className="loading">Loading…</div>;
  }

  return (
    <div className="page">
      <section className="section card">
        <div className="card__header">Set email and password for DVP, TNV, Vendors</div>
        <div className="card__body">
          <form
            onSubmit={createUser}
            style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 420, marginBottom: 20 }}
          >
            <div className="form-group">
              <label className="form-group__label">Name</label>
              <input
                className="input"
                placeholder="Name"
                value={userForm.name}
                onChange={(e) => setUserForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-group__label">Email (login)</label>
              <input
                type="email"
                className="input"
                placeholder="Email"
                value={userForm.email}
                onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-group__label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="Password"
                value={userForm.password}
                onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-group__label">Role</label>
              <select
                className="select"
                value={userForm.role}
                onChange={(e) => setUserForm((p) => ({ ...p, role: e.target.value }))}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-group__label">Company (optional)</label>
              <input
                className="input"
                placeholder="Company"
                value={userForm.company}
                onChange={(e) => setUserForm((p) => ({ ...p, company: e.target.value }))}
              />
            </div>
            {userFormError && <div className="alert alert--error">{userFormError}</div>}
            <button type="submit" className="btn btn--primary">
              Create user
            </button>
          </form>
          <h4 style={{ marginBottom: 10, fontSize: "0.9375rem", fontWeight: 600 }}>
            All users (DVP, TNV, Vendors – multiple logins)
          </h4>
          {allUsers.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", padding: 12, margin: 0 }}>
              No users yet. Create users above; each can sign in with their email and password.
            </p>
          ) : (
            <ul className="list" style={{ marginBottom: 0 }}>
              {allUsers.map((u) => (
                <li key={u._id} className="list-item">
                  <div className="list-item__main">
                    <div className="list-item__title">{u.name || u.email}</div>
                    <div className="list-item__meta">
                      {u.email}
                      <span className="badge badge--default" style={{ marginLeft: 8 }}>
                        {u.role}
                      </span>
                      {u.company ? ` · ${u.company}` : ""}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
