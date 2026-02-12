import { useEffect, useState } from "react";
import API from "../api.js";
import { baseURL } from "../api.js";

const uploadsBase = (baseURL || "").replace(/\/api\/?$/, "");

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [projects, setProjects] = useState([]);
  const [harnesses, setHarnesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [etaHistoryFor, setEtaHistoryFor] = useState(null);
  const [pdiForHarness, setPdiForHarness] = useState(null);
  const [pdiReports, setPdiReports] = useState([]);

  const load = () => {
    setError("");
    Promise.all([
      API.get("/auth/users").then((res) => setVendors((res.data || []).filter((u) => u.role === "VENDOR"))).catch(() => setVendors([])),
      API.get("/projects").then((res) => setProjects(res.data || [])).catch(() => setProjects([])),
      API.get("/harness").then((res) => setHarnesses(res.data || [])).catch(() => setHarnesses([])),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!pdiForHarness) {
      setPdiReports([]);
      return;
    }
    API.get(`/report/harness/${pdiForHarness._id}`)
      .then((res) => setPdiReports((res.data || []).filter((r) => (r.type || "").toUpperCase() === "PDI_REPORT")))
      .catch(() => setPdiReports([]));
  }, [pdiForHarness]);

  const harnessesForVendor = (vendorId) =>
    harnesses.filter((h) => (h.assignedVendors || []).some((v) => (v._id || v) === vendorId));

  const harnessesForProject = selectedProjectId
    ? harnesses.filter((h) => (h.projectId?._id || h.projectId) === selectedProjectId)
    : [];

  const vendorLabel = (v) => v?.name || v?.email || "Vendor";

  const assignedVendorsLabel = (h) =>
    (h.assignedVendors || []).map((v) => vendorLabel(v)).join(", ") || "—";

  const selectedProjectName = selectedProjectId
    ? projects.find((p) => p._id === selectedProjectId)?.vehicleModel || selectedProjectId
    : "";

  if (loading) {
    return (
      <div className="page">
        <div className="loading">Loading…</div>
      </div>
    );
  }

  return (
    <div className="page">
      <section className="section">
        <h2 className="section__title">Vendors</h2>
        <p style={{ color: "var(--color-text-muted)", marginBottom: 20, fontSize: "0.9375rem" }}>
          Choose a project (e.g. CP Model FC) to see all harnesses for that model with full details. Or view by vendor below.
        </p>

        {error && (
          <div className="alert alert--error" style={{ marginBottom: 20 }}>
            {error}
          </div>
        )}

        <div className="form-group" style={{ maxWidth: 360, marginBottom: 24 }}>
          <label className="form-group__label">Project (model) – view all harnesses for this project</label>
          <select
            className="select"
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value || "");
              setEtaHistoryFor(null);
              setPdiForHarness(null);
            }}
          >
            <option value="">— Select project / model —</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.vehicleModel || p._id}{p.platform ? ` – ${p.platform}` : ""}
              </option>
            ))}
          </select>
        </div>

        {selectedProjectId ? (
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card__header" style={{ fontSize: "1.125rem" }}>
              All harnesses in {selectedProjectName}
            </div>
            <div className="card__body">
              {harnessesForProject.length === 0 ? (
                <p style={{ color: "var(--color-text-muted)", margin: 0 }}>No harnesses in this project.</p>
              ) : (
                <div className="table-wrap" style={{ overflowX: "auto" }}>
                  <table className="tracking-table">
                    <thead>
                      <tr>
                        <th>Part no</th>
                        <th>Part description</th>
                        <th>Drawings release date</th>
                        <th>Status</th>
                        <th>Assigned vendor(s)</th>
                        <th>Current ETA</th>
                        <th>DVP No</th>
                        <th>TNV docket</th>
                        <th>DVP status</th>
                        <th>TNV status</th>
                        <th>ETA history</th>
                        <th>PDI reports</th>
                      </tr>
                    </thead>
                    <tbody>
                      {harnessesForProject.map((h) => (
                        <tr key={h._id}>
                          <td>{h.partNo || "—"}</td>
                          <td>{h.partDescription || "—"}</td>
                          <td>{formatDate(h.drawingsReleaseDate)}</td>
                          <td><span className="badge badge--default">{h.status || "—"}</span></td>
                          <td>{assignedVendorsLabel(h)}</td>
                          <td>{h.vendorEta ? formatDate(h.vendorEta) : "—"}</td>
                          <td>{h.dvpNo || "—"}</td>
                          <td>{h.tnvDocketNo || "—"}</td>
                          <td><span className="badge badge--default">{h.dvpStatus || "—"}</span></td>
                          <td><span className="badge badge--default">{h.tnvStatus || "—"}</span></td>
                          <td>
                            <button
                              type="button"
                              className="btn btn--secondary"
                              onClick={() => setEtaHistoryFor(etaHistoryFor?._id === h._id ? null : h)}
                            >
                              {etaHistoryFor?._id === h._id ? "Hide" : "ETA history"}
                            </button>
                            {etaHistoryFor?._id === h._id && (h.vendorEtaHistory || []).length > 0 && (
                              <div style={{ marginTop: 8, padding: 12, background: "var(--color-bg-subtle, #f8f9fa)", borderRadius: 8, fontSize: "0.875rem" }}>
                                <strong>Past ETAs</strong>
                                <ul style={{ margin: "6px 0 0", paddingLeft: 20 }}>
                                  {(h.vendorEtaHistory || []).map((entry, i) => (
                                    <li key={i}>
                                      {formatDate(entry.eta)} — set {formatDate(entry.setAt)}
                                      {entry.setBy && ` by ${entry.setBy.name || entry.setBy.email}`}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {etaHistoryFor?._id === h._id && (!h.vendorEtaHistory || h.vendorEtaHistory.length === 0) && (
                              <p style={{ marginTop: 8, color: "var(--color-text-muted)", fontSize: "0.875rem" }}>No ETA history.</p>
                            )}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn--secondary"
                              onClick={() => setPdiForHarness(pdiForHarness?._id === h._id ? null : h)}
                            >
                              {pdiForHarness?._id === h._id ? "Hide" : "PDI reports"}
                            </button>
                            {pdiForHarness?._id === h._id && (
                              <div style={{ marginTop: 8, fontSize: "0.875rem" }}>
                                {pdiReports.length === 0 ? (
                                  <p style={{ margin: 0, color: "var(--color-text-muted)" }}>No PDI reports.</p>
                                ) : (
                                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                                    {pdiReports.map((r) => (
                                      <li key={r._id} style={{ marginBottom: 4 }}>
                                        <a href={`${uploadsBase}/${r.fileUrl}`} target="_blank" rel="noopener noreferrer">
                                          {r.fileUrl?.split("/").pop() || "PDI report"} {r.remarks ? ` – ${r.remarks}` : ""}
                                        </a>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {!selectedProjectId && vendors.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)", padding: 20 }}>No vendors.</p>
        ) : !selectedProjectId ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <h3 className="section__title" style={{ fontSize: "1rem", marginBottom: 12 }}>By vendor</h3>
            {vendors.map((vendor) => {
              const assigned = harnessesForVendor(vendor._id);
              return (
                <div key={vendor._id} className="card">
                  <div className="card__header" style={{ fontSize: "1.125rem" }}>
                    {vendorLabel(vendor)}
                    {vendor.company && <span style={{ fontWeight: 400, color: "var(--color-text-muted)", marginLeft: 8 }}>({vendor.company})</span>}
                  </div>
                  <div className="card__body">
                    {assigned.length === 0 ? (
                      <p style={{ color: "var(--color-text-muted)", margin: 0 }}>No harnesses assigned.</p>
                    ) : (
                      <div className="table-wrap">
                        <table className="tracking-table">
                          <thead>
                            <tr>
                              <th>Part no</th>
                              <th>Project</th>
                              <th>Current ETA</th>
                              <th>ETA history</th>
                              <th>PDI reports</th>
                            </tr>
                          </thead>
                          <tbody>
                            {assigned.map((h) => (
                              <tr key={h._id}>
                                <td>{h.partNo} – {h.partDescription || "—"}</td>
                                <td>{h.projectId?.vehicleModel || "—"}</td>
                                <td>{h.vendorEta ? formatDate(h.vendorEta) : "—"}</td>
                                <td>
                                  <button
                                    type="button"
                                    className="btn btn--secondary"
                                    onClick={() => setEtaHistoryFor(etaHistoryFor?._id === h._id ? null : h)}
                                  >
                                    {etaHistoryFor?._id === h._id ? "Hide" : "View ETA history"}
                                  </button>
                                  {etaHistoryFor?._id === h._id && (h.vendorEtaHistory || []).length > 0 && (
                                    <div style={{ marginTop: 8, padding: 12, background: "var(--color-bg-subtle, #f8f9fa)", borderRadius: 8, fontSize: "0.875rem" }}>
                                      <strong>All past ETAs set by vendor</strong>
                                      <ul style={{ margin: "6px 0 0", paddingLeft: 20 }}>
                                        {(h.vendorEtaHistory || []).map((entry, i) => (
                                          <li key={i}>
                                            {formatDate(entry.eta)} — set {formatDate(entry.setAt)}
                                            {entry.setBy && ` by ${entry.setBy.name || entry.setBy.email}`}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {etaHistoryFor?._id === h._id && (!h.vendorEtaHistory || h.vendorEtaHistory.length === 0) && (
                                    <p style={{ marginTop: 8, color: "var(--color-text-muted)", fontSize: "0.875rem" }}>No ETA history yet.</p>
                                  )}
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="btn btn--secondary"
                                    onClick={() => setPdiForHarness(pdiForHarness?._id === h._id ? null : h)}
                                  >
                                    {pdiForHarness?._id === h._id ? "Hide" : "View PDI reports"}
                                  </button>
                                  {pdiForHarness?._id === h._id && (
                                    <div style={{ marginTop: 8, fontSize: "0.875rem" }}>
                                      {pdiReports.length === 0 ? (
                                        <p style={{ margin: 0, color: "var(--color-text-muted)" }}>No PDI reports.</p>
                                      ) : (
                                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                                          {pdiReports.map((r) => (
                                            <li key={r._id} style={{ marginBottom: 4 }}>
                                              <a href={`${uploadsBase}/${r.fileUrl}`} target="_blank" rel="noopener noreferrer">
                                                {r.fileUrl?.split("/").pop() || "PDI report"} {r.remarks ? ` – ${r.remarks}` : ""}
                                              </a>
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </section>
    </div>
  );
}
