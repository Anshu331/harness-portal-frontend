import { useEffect, useState } from "react";
import API from "../api.js";
import { baseURL } from "../api.js";
import DashboardLayout from "../components/DashboardLayout.jsx";

const uploadsBase = (baseURL || "").replace(/\/api\/?$/, "");
const DOC_ACCEPT = ".pdf,.xlsx,.xls,.xlsm,.csv";

export default function TNVDashboard() {
  const [harnesses, setHarnesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assigning, setAssigning] = useState(null);
  const [docket, setDocket] = useState("");
  const [docHarness, setDocHarness] = useState(null);
  const [docList, setDocList] = useState([]);
  const [docFile, setDocFile] = useState(null);
  const [docRemarks, setDocRemarks] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dvpReportsHarness, setDvpReportsHarness] = useState(null);
  const [dvpReportsList, setDvpReportsList] = useState([]);

  const TNV_STATUS_OPTIONS = [
    { value: "PENDING", label: "Pending" },
    { value: "PASS", label: "Go ahead" },
    { value: "FAIL", label: "Fail" },
    { value: "CONDITIONAL_PASS", label: "Conditional pass" },
  ];

  const load = () => {
    setError("");
    API.get("/harness")
      .then((res) => setHarnesses(res.data))
      .catch(() => setHarnesses([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!docHarness) {
      setDocList([]);
      return;
    }
    API.get(`/report/harness/${docHarness._id}`)
      .then((res) =>
        setDocList(
          (res.data || []).filter(
            (r) =>
              (r.type || "").toUpperCase() === "TNV_REPORT" ||
              (r.type || "").toUpperCase() === "TNV_DOCUMENT" ||
              (r.type || "").toUpperCase() === "REPORT"
          )
        )
      )
      .catch(() => setDocList([]));
  }, [docHarness]);

  useEffect(() => {
    if (!dvpReportsHarness) {
      setDvpReportsList([]);
      return;
    }
    API.get(`/report/harness/${dvpReportsHarness._id}`)
      .then((res) =>
        setDvpReportsList(
          (res.data || []).filter(
            (r) =>
              (r.type || "").toUpperCase() === "DVP_REPORT" ||
              (r.type || "").toUpperCase() === "REPORT"
          )
        )
      )
      .catch(() => setDvpReportsList([]));
  }, [dvpReportsHarness]);

  const openAssign = (h) => {
    setAssigning(h);
    setDocket(h.tnvDocketNo || "");
  };
  const closeAssign = () => {
    setAssigning(null);
    setDocket("");
  };

  const submitAssign = async (e) => {
    e.preventDefault();
    if (!assigning) return;
    setError("");
    try {
      await API.patch(`/harness/assignTNV/${assigning._id}`, { tnvDocketNo: docket });
      closeAssign();
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || "Assign failed");
    }
  };

  const setTnvStatus = async (harnessId, tnvStatus) => {
    setError("");
    try {
      await API.patch(`/harness/tnv-status/${harnessId}`, { tnvStatus });
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || "Set status failed");
    }
  };

  const openDocUpload = (h) => {
    setDocHarness(h);
    setDocFile(null);
    setDocRemarks("");
  };
  const closeDocUpload = () => {
    setDocHarness(null);
    setDocFile(null);
    setDocRemarks("");
  };
  const submitDoc = async (e) => {
    e.preventDefault();
    if (!docHarness || !docFile) return;
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", docFile);
      formData.append("type", "TNV_REPORT");
      if (docRemarks.trim()) formData.append("remarks", docRemarks.trim());
      await API.post(`/report/upload/${docHarness._id}`, formData);
      setDocFile(null);
      setDocRemarks("");
      API.get(`/report/harness/${docHarness._id}`)
        .then((res) =>
          setDocList(
            (res.data || []).filter(
              (r) =>
                (r.type || "").toUpperCase() === "TNV_REPORT" ||
                (r.type || "").toUpperCase() === "TNV_DOCUMENT" ||
                (r.type || "").toUpperCase() === "REPORT"
            )
          )
        )
        .catch(() => {});
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const fileExt = (url) => {
    if (!url) return "";
    const m = url.match(/\.([a-z0-9]+)$/i);
    return m ? m[1].toLowerCase() : "";
  };

  if (loading) {
    return (
      <DashboardLayout title="TNV Portal">
        <div className="loading">Loading…</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="TNV Portal">
      <div className="page">
        {error && (
          <div className="alert alert--error" style={{ marginBottom: 20 }}>
            {error}
          </div>
        )}

        <section className="section">
          <h3 className="section__title">All harnesses – TNV check</h3>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginBottom: 16 }}>
            When DVP is done (DVP No and status set), it appears here. View DVP reports, then write docket no, give Go ahead/Fail, and upload TNV documents.
          </p>
          {harnesses.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", padding: 20 }}>No harnesses.</p>
          ) : (
            <ul className="list">
              {harnesses.map((h) => (
                <li key={h._id} className="list-item" style={{ flexDirection: "column", alignItems: "stretch" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div className="list-item__main">
                      <div className="list-item__title">
                        {h.partNo} – {h.partDescription}
                      </div>
                      <div className="list-item__meta">
                        {h.projectId && h.projectId.vehicleModel}
                        <span className="badge badge--default" style={{ marginLeft: 8 }}>
                          {h.status}
                        </span>
                        {h.dvpNo ? <span style={{ marginLeft: 8 }}>DVP done · No: {h.dvpNo}</span> : null}
                        {h.dvpStatus && h.dvpStatus !== "PENDING" ? (
                          <span
                            className={`badge ${
                              h.dvpStatus === "PASS" ? "badge--success" :
                              h.dvpStatus === "FAIL" ? "badge--danger" :
                              h.dvpStatus === "CONDITIONAL_PASS" ? "badge--warning" : "badge--default"
                            }`}
                            style={{ marginLeft: 8 }}
                          >
                            DVP: {h.dvpStatus}
                          </span>
                        ) : h.dvpNo ? (
                          <span className="badge badge--default" style={{ marginLeft: 8 }}>DVP: {h.dvpStatus || "PENDING"}</span>
                        ) : null}
                        {h.tnvDocketNo ? <span style={{ marginLeft: 8 }}>Docket: {h.tnvDocketNo}</span> : null}
                        <span
                          className={`badge ${
                            h.tnvStatus === "PASS" ? "badge--success" :
                            h.tnvStatus === "FAIL" ? "badge--danger" :
                            h.tnvStatus === "CONDITIONAL_PASS" ? "badge--warning" : "badge--default"
                          }`}
                          style={{ marginLeft: 8 }}
                        >
                          TNV: {h.tnvStatus === "PASS" ? "Go ahead" : (h.tnvStatus || "PENDING")}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() => setDvpReportsHarness(dvpReportsHarness?._id === h._id ? null : h)}
                      >
                        {dvpReportsHarness?._id === h._id ? "Hide DVP reports" : "View DVP reports"}
                      </button>
                      <button type="button" className="btn btn--primary" onClick={() => openAssign(h)}>
                        {h.tnvDocketNo ? "Edit docket" : "Write docket no"}
                      </button>
                      <select
                        className="select"
                        style={{ width: "auto", minWidth: 140 }}
                        value={h.tnvStatus || "PENDING"}
                        onChange={(e) => setTnvStatus(h._id, e.target.value)}
                        title="Go ahead / Fail"
                      >
                        {TNV_STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <button type="button" className="btn btn--secondary" onClick={() => openDocUpload(h)}>
                        Upload documents
                      </button>
                    </div>
                  </div>
                  {dvpReportsHarness && dvpReportsHarness._id === h._id && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--color-border)" }}>
                      <div className="form-group__label" style={{ marginBottom: 8 }}>DVP reports (uploaded by DVP) – view only</div>
                      {dvpReportsList.length === 0 ? (
                        <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: "0.875rem" }}>No DVP reports uploaded yet.</p>
                      ) : (
                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                          {dvpReportsList.map((r) => (
                            <li key={r._id} style={{ marginBottom: 4 }}>
                              <a href={`${uploadsBase}/${r.fileUrl}`} target="_blank" rel="noopener noreferrer">
                                {r.fileUrl?.split("/").pop() || "Report"} {r.remarks ? ` – ${r.remarks}` : ""}
                              </a>
                              {["pdf", "xlsx", "xls", "csv"].includes(fileExt(r.fileUrl)) ? (
                                <span style={{ marginLeft: 8, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                                  ({fileExt(r.fileUrl).toUpperCase()})
                                </span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      )}
                      <button type="button" className="btn btn--secondary" onClick={() => setDvpReportsHarness(null)} style={{ marginTop: 10 }}>
                        Close
                      </button>
                    </div>
                  )}
                  {docHarness && docHarness._id === h._id && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--color-border)" }}>
                      <div style={{ marginBottom: 12 }}>
                        <label className="form-group__label">
                          Upload document (PDF or sheet: .xlsx, .xls, .csv)
                        </label>
                        <form onSubmit={submitDoc} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 400 }}>
                          <input
                            type="file"
                            accept={DOC_ACCEPT}
                            className="input"
                            onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                          />
                          <input
                            className="input"
                            placeholder="Remarks (optional)"
                            value={docRemarks}
                            onChange={(e) => setDocRemarks(e.target.value)}
                          />
                          <button
                            type="submit"
                            className="btn btn--primary"
                            disabled={!docFile || uploading}
                            style={{ alignSelf: "flex-start" }}
                          >
                            {uploading ? "Uploading…" : "Upload"}
                          </button>
                        </form>
                      </div>
                      <div>
                        <span className="form-group__label">Uploaded documents for this harness</span>
                        {docList.length === 0 ? (
                          <p style={{ color: "var(--color-text-muted)", margin: "8px 0 0", fontSize: "0.875rem" }}>
                            None yet.
                          </p>
                        ) : (
                          <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
                            {docList.map((r) => (
                              <li key={r._id} style={{ marginBottom: 4 }}>
                                <a href={`${uploadsBase}/${r.fileUrl}`} target="_blank" rel="noopener noreferrer">
                                  {r.fileUrl?.split("/").pop() || "Document"} {r.remarks ? ` – ${r.remarks}` : ""}
                                </a>
                                {["pdf", "xlsx", "xls", "csv"].includes(fileExt(r.fileUrl)) ? (
                                  <span style={{ marginLeft: 8, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                                    ({fileExt(r.fileUrl).toUpperCase()})
                                  </span>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <button type="button" className="btn btn--secondary" onClick={closeDocUpload} style={{ marginTop: 12 }}>
                        Close
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {assigning && (
          <section className="section card">
            <div className="card__header">Write docket no: {assigning.partNo}</div>
            <div className="card__body">
              <form
                onSubmit={submitAssign}
                className="form-row"
                style={{ alignItems: "center", flexWrap: "wrap" }}
              >
                <div className="form-group" style={{ flex: "1 1 200px", maxWidth: 280 }}>
                  <label className="form-group__label">Docket No</label>
                  <input
                    className="input"
                    placeholder="Docket No"
                    value={docket}
                    onChange={(e) => setDocket(e.target.value)}
                  />
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                  <button type="submit" className="btn btn--primary">
                    Save
                  </button>
                  <button type="button" className="btn btn--secondary" onClick={closeAssign}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
