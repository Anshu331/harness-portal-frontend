import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api.js";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [harnesses, setHarnesses] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [projectForm, setProjectForm] = useState({ vehicleModel: "", platform: "" });
  const [harnessForm, setHarnessForm] = useState({
    projectId: "",
    partNo: "",
    partDescription: "",
    assignedVendors: [],
  });
  const [releaseDateFor, setReleaseDateFor] = useState(null);
  const [releaseDateValue, setReleaseDateValue] = useState("");
  const [assignVendorsFor, setAssignVendorsFor] = useState(null);
  const [assignVendorsSelected, setAssignVendorsSelected] = useState([]);

  const loadStats = () => API.get("/dashboard").then((res) => setStats(res.data));
  const loadProjects = () => API.get("/projects").then((res) => setProjects(res.data));
  const loadHarnesses = (projectId) =>
    projectId
      ? API.get(`/harness/${projectId}`).then((res) => setHarnesses(res.data))
      : API.get("/harness").then((res) => setHarnesses(res.data));

  const loadUsers = () =>
    API.get("/auth/users")
      .then((res) => setVendors(res.data.filter((u) => u.role === "VENDOR")))
      .catch(() => setVendors([]));

  useEffect(() => {
    setError("");
    Promise.all([
      loadStats().catch((e) => setError(e.response?.data?.message || "Failed to load stats")),
      loadProjects().catch(() => setProjects([])),
      loadUsers(),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      loadHarnesses().catch(() => setHarnesses([]));
      return;
    }
    loadHarnesses(selectedProjectId).catch(() => setHarnesses([]));
  }, [selectedProjectId]);

  const createProject = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await API.post("/projects", projectForm);
      setProjectForm({ vehicleModel: "", platform: "" });
      loadProjects();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || "Failed to create project");
    }
  };

  const createHarness = async (e) => {
    e.preventDefault();
    setError("");
    const payload = {
      projectId: harnessForm.projectId || selectedProjectId || undefined,
      partNo: harnessForm.partNo,
      partDescription: harnessForm.partDescription,
      assignedVendors: harnessForm.assignedVendors,
    };
    if (!payload.projectId) {
      setError("Select a project");
      return;
    }
    try {
      await API.post("/harness", payload);
      setHarnessForm({ projectId: "", partNo: "", partDescription: "", assignedVendors: [] });
      loadHarnesses(payload.projectId || selectedProjectId);
      loadStats();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || "Failed to create harness");
    }
  };

  const toggleVendor = (id) => {
    setHarnessForm((prev) => ({
      ...prev,
      assignedVendors: prev.assignedVendors.includes(id)
        ? prev.assignedVendors.filter((v) => v !== id)
        : [...prev.assignedVendors, id],
    }));
  };

  const openReleaseDate = (h) => {
    setReleaseDateFor(h._id);
    setReleaseDateValue(h.drawingsReleaseDate ? new Date(h.drawingsReleaseDate).toISOString().slice(0, 10) : "");
  };
  const cancelReleaseDate = () => {
    setReleaseDateFor(null);
    setReleaseDateValue("");
  };
  const setReleaseDate = async (harnessId) => {
    if (!releaseDateValue.trim()) return;
    setError("");
    try {
      await API.patch(`/harness/release/${harnessId}`, { drawingsReleaseDate: releaseDateValue });
      cancelReleaseDate();
      loadHarnesses(selectedProjectId || undefined);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || "Failed to set release date");
    }
  };

  const openAssignVendors = (h) => {
    setAssignVendorsFor(h._id);
    setAssignVendorsSelected((h.assignedVendors || []).map((v) => v._id || v));
  };
  const cancelAssignVendors = () => {
    setAssignVendorsFor(null);
    setAssignVendorsSelected([]);
  };
  const toggleAssignVendor = (id) => {
    setAssignVendorsSelected((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };
  const saveAssignVendors = async (harnessId) => {
    setError("");
    try {
      await API.patch(`/harness/assign-vendors/${harnessId}`, { assignedVendors: assignVendorsSelected });
      cancelAssignVendors();
      loadHarnesses(selectedProjectId || undefined);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || "Failed to assign vendors");
    }
  };

  if (loading) {
    return <div className="loading">Loading…</div>;
  }

  return (
    <div className="page">
        {error && (
          <div className="alert alert--error" style={{ marginBottom: 20 }}>
            {error}
          </div>
        )}

        <section className="section">
          <h3 className="section__title">Program statistics</h3>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginBottom: 12 }}>
            Tap a stat to open a page with all details.
          </p>
          {stats && (
            <div className="stats">
              <Link to="/stats/total" className="stat stat--link" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="stat__value">{stats.totalHarness}</div>
                <div className="stat__label">Total harness</div>
              </Link>
              <Link to="/stats/development" className="stat stat--link" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="stat__value">{stats.development}</div>
                <div className="stat__label">Development</div>
              </Link>
              <Link to="/stats/dispatched" className="stat stat--link" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="stat__value">{stats.dispatched}</div>
                <div className="stat__label">Dispatched</div>
              </Link>
              <Link to="/stats/received" className="stat stat--link" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="stat__value">{stats.received}</div>
                <div className="stat__label">Received</div>
              </Link>
            </div>
          )}
        </section>

        <section className="section card">
          <div className="card__header">Create project</div>
          <div className="card__body">
            <form onSubmit={createProject} className="form-row">
              <div className="form-group" style={{ flex: "1 1 180px" }}>
                <input
                  className="input"
                  placeholder="Vehicle model"
                  value={projectForm.vehicleModel}
                  onChange={(e) => setProjectForm((p) => ({ ...p, vehicleModel: e.target.value }))}
                />
              </div>
              <div className="form-group" style={{ flex: "1 1 180px" }}>
                <input
                  className="input"
                  placeholder="Platform"
                  value={projectForm.platform}
                  onChange={(e) => setProjectForm((p) => ({ ...p, platform: e.target.value }))}
                />
              </div>
              <button type="submit" className="btn btn--primary">
                Create project
              </button>
            </form>
          </div>
        </section>

        <section className="section">
          <h3 className="section__title">Projects</h3>
          <div className="chips">
            <button
              type="button"
              className={`chip ${!selectedProjectId ? "chip--active" : ""}`}
              onClick={() => setSelectedProjectId("")}
            >
              All
            </button>
            {projects.map((p) => (
              <button
                key={p._id}
                type="button"
                className={`chip ${selectedProjectId === p._id ? "chip--active" : ""}`}
                onClick={() => setSelectedProjectId(p._id)}
              >
                {p.vehicleModel} – {p.platform}
              </button>
            ))}
          </div>
        </section>

        <section className="section card">
          <div className="card__header">Create harness and assign to vendors</div>
          <p style={{ padding: "0 20px 12px", margin: 0, fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            Assign one or more vendors per harness. Each vendor gets a separate login (create in Users management); they only see harnesses assigned to them and can set ETA and upload photos for those.
          </p>
          <div className="card__body">
            <form onSubmit={createHarness} style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 420 }}>
              <div className="form-group">
                <label className="form-group__label">Project</label>
                <select
                  className="select"
                  value={harnessForm.projectId || selectedProjectId}
                  onChange={(e) => {
                    setHarnessForm((p) => ({ ...p, projectId: e.target.value }));
                    setSelectedProjectId(e.target.value || selectedProjectId);
                  }}
                >
                  <option value="">Select project</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.vehicleModel} – {p.platform}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-group__label">Part number</label>
                <input
                  className="input"
                  placeholder="Part number"
                  value={harnessForm.partNo}
                  onChange={(e) => setHarnessForm((p) => ({ ...p, partNo: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-group__label">Part description</label>
                <input
                  className="input"
                  placeholder="Part description"
                  value={harnessForm.partDescription}
                  onChange={(e) => setHarnessForm((p) => ({ ...p, partDescription: e.target.value }))}
                />
              </div>
              {vendors.length > 0 && (
                <div className="form-group">
                  <label className="form-group__label">Assign vendors</label>
                  <div className="checkbox-group">
                    {vendors.map((v) => (
                      <label key={v._id}>
                        <input
                          type="checkbox"
                          checked={harnessForm.assignedVendors.includes(v._id)}
                          onChange={() => toggleVendor(v._id)}
                        />
                        {v.name || v.email}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <button type="submit" className="btn btn--primary">
                Create harness
              </button>
            </form>
          </div>
        </section>

        <section className="section">
          <h3 className="section__title">
            Harnesses {selectedProjectId ? "(selected project)" : "(all)"}
          </h3>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginBottom: 16 }}>
            Set drawings release date and assign vendors for each harness. Assigned vendors can then see the harness and set ETA / upload photos.
          </p>
          <ul className="list">
            {harnesses.map((h) => (
              <li key={h._id} className="list-item" style={{ flexDirection: "column", alignItems: "stretch" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div className="list-item__main">
                    <div className="list-item__title">
                      {h.partNo} – {h.partDescription}
                    </div>
                    <div className="list-item__meta">
                      {h.projectId && (
                        <span>{h.projectId.vehicleModel}</span>
                      )}
                      <span className="badge badge--default" style={{ marginLeft: 8 }}>
                        {h.status}
                      </span>
                      {h.dvpNo && <span style={{ marginLeft: 8 }}>DVP: {h.dvpNo}</span>}
                      {h.tnvDocketNo && <span style={{ marginLeft: 8 }}>TNV: {h.tnvDocketNo}</span>}
                      {h.assignedVendors?.length
                        ? ` · Vendors: ${h.assignedVendors.map((v) => v.name || v.email).join(", ")}`
                        : " · No vendors assigned"}
                      {h.drawingsReleaseDate && (
                        <span style={{ marginLeft: 8 }}>
                          · Released: {new Date(h.drawingsReleaseDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => openReleaseDate(h)}
                      disabled={releaseDateFor !== null && releaseDateFor !== h._id}
                    >
                      {h.drawingsReleaseDate ? "Change release date" : "Set drawings release date"}
                    </button>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => openAssignVendors(h)}
                      disabled={assignVendorsFor !== null && assignVendorsFor !== h._id}
                    >
                      Assign vendors
                    </button>
                  </div>
                </div>
                {releaseDateFor === h._id && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <input
                      type="date"
                      className="input"
                      style={{ width: 160 }}
                      value={releaseDateValue}
                      onChange={(e) => setReleaseDateValue(e.target.value)}
                    />
                    <button type="button" className="btn btn--primary" onClick={() => setReleaseDate(h._id)}>
                      Set release date
                    </button>
                    <button type="button" className="btn btn--secondary" onClick={cancelReleaseDate}>
                      Cancel
                    </button>
                  </div>
                )}
                {assignVendorsFor === h._id && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--color-border)" }}>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label className="form-group__label">Select vendors for this harness</label>
                      {vendors.length === 0 ? (
                        <p style={{ color: "var(--color-text-muted)", margin: 0 }}>Create vendors in Users management first.</p>
                      ) : (
                        <div className="checkbox-group">
                          {vendors.map((v) => (
                            <label key={v._id}>
                              <input
                                type="checkbox"
                                checked={assignVendorsSelected.includes(v._id)}
                                onChange={() => toggleAssignVendor(v._id)}
                              />
                              {v.name || v.email}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button type="button" className="btn btn--primary" onClick={() => saveAssignVendors(h._id)}>
                        Save vendors
                      </button>
                      <button type="button" className="btn btn--secondary" onClick={cancelAssignVendors}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
          {harnesses.length === 0 && (
            <p style={{ color: "var(--color-text-muted)", padding: 20 }}>
              No harnesses.
            </p>
          )}
        </section>
      </div>
  );
}
