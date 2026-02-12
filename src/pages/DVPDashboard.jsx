import { useEffect, useState } from "react";
import API from "../api.js";
import { baseURL } from "../api.js";
import DashboardLayout from "../components/DashboardLayout.jsx";

const uploadsBase = (baseURL || "").replace(/\/api\/?$/, "");
const REPORT_ACCEPT = ".pdf,.xlsx,.xls,.xlsm,.csv";

export default function DVPDashboard() {
  const [harnesses, setHarnesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assigning, setAssigning] = useState(null);
  const [dvpNo, setDvpNo] = useState("");
  const [reportHarness, setReportHarness] = useState(null);
  const [reportList, setReportList] = useState([]);
  const [reportFile, setReportFile] = useState(null);
  const [reportRemarks, setReportRemarks] = useState("");
  const [uploading, setUploading] = useState(false);

  const DVP_STATUS_OPTIONS = [
    { value: "PENDING", label: "Pending" },
    { value: "PASS", label: "Pass" },
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
    if (!reportHarness) {
      setReportList([]);
      return;
    }
    API.get(`/report/harness/${reportHarness._id}`)
      .then((res) => setReportList((res.data || []).filter((r) => (r.type || "").toUpperCase() === "DVP_REPORT" || (r.type || "").toUpperCase() === "REPORT")))
      .catch(() => setReportList([]));
  }, [reportHarness]);

  const openAssign = (h) => {
    setAssigning(h);
    setDvpNo(h.dvpNo || "");
  };
  const closeAssign = () => {
    setAssigning(null);
    setDvpNo("");
  };

  const submitAssign = async (e) => {
    e.preventDefault();
    if (!assigning) return;
    setError("");
    try {
      await API.patch(`/harness/assignDVP/${assigning._id}`, { dvpNo });
      closeAssign();
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || "Assign failed");
    }
  };

  const setDvpStatus = async (harnessId, dvpStatus) => {
    setError("");
    try {
      await API.patch(`/harness/dvp-status/${harnessId}`, { dvpStatus });
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || "Set status failed");
    }
  };

  const openReportUpload = (h) => {
    setReportHarness(h);
    setReportFile(null);
    setReportRemarks("");
  };
  const closeReportUpload = () => {
    setReportHarness(null);
    setReportFile(null);
    setReportRemarks("");
  };
  const submitReport = async (e) => {
    e.preventDefault();
    if (!reportHarness || !reportFile) return;
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", reportFile);
      formData.append("type", "DVP_REPORT");
      if (reportRemarks.trim()) formData.append("remarks", reportRemarks.trim());
      await API.post(`/report/upload/${reportHarness._id}`, formData);
      setReportFile(null);
      setReportRemarks("");
      API.get(`/report/harness/${reportHarness._id}`)
        .then((res) => setReportList((res.data || []).filter((r) => (r.type || "").toUpperCase() === "DVP_REPORT" || (r.type || "").toUpperCase() === "REPORT")))
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
      <DashboardLayout title="DVP Portal">
        <div className="loading">Loading…</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="DVP Portal">
      <div className="page">
        {error && (
          <div className="alert alert--error" style={{ marginBottom: 20 }}>
            {error}
          </div>
        )}

        {(harnesses.filter((h) => h.sampleReceived).length > 0) && (
          <section className="section card" style={{ borderLeft: "4px solid var(--color-success)" }}>
            <div className="card__header">Samples received – ready for DVP</div>
            <div className="card__body">
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginBottom: 12 }}>
                These harnesses have been marked as sample received in Tracking. Please do DVP check for them (write DVP No, set Pass/Fail/Conditional pass, upload reports).
              </p>
              <ul className="list" style={{ marginBottom: 0 }}>
                {harnesses.filter((h) => h.sampleReceived).map((h) => (
                  <li key={h._id} className="list-item">
                    <div className="list-item__main">
                      <div className="list-item__title">
                        {h.partNo} – {h.partDescription}
                      </div>
                      <div className="list-item__meta">
                        {h.projectId && h.projectId.vehicleModel}
                        {h.sampleReceivedDate && (
                          <span style={{ marginLeft: 8 }}>
                            Sample received: {new Date(h.sampleReceivedDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="badge badge--success">Ready for DVP</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section className="section">
          <h3 className="section__title">All harnesses – DVP check</h3>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginBottom: 16 }}>
            You have access to all harnesses. For each harness: write DVP No, mark as Pass / Fail / Conditional pass, and upload reports (PDF or sheet).
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
                        {h.dvpNo ? <span style={{ marginLeft: 8 }}>DVP No: {h.dvpNo}</span> : null}
                        <span
                          className={`badge ${
                            h.dvpStatus === "PASS" ? "badge--success" :
                            h.dvpStatus === "FAIL" ? "badge--danger" :
                            h.dvpStatus === "CONDITIONAL_PASS" ? "badge--warning" : "badge--default"
                          }`}
                          style={{ marginLeft: 8 }}
                        >
                          {h.dvpStatus || "PENDING"}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                      <button
                        type="button"
                        className="btn btn--primary"
                        onClick={() => openAssign(h)}
                      >
                        {h.dvpNo ? "Edit DVP No" : "Write DVP No"}
                      </button>
                      <select
                        className="select"
                        style={{ width: "auto", minWidth: 140 }}
                        value={h.dvpStatus || "PENDING"}
                        onChange={(e) => setDvpStatus(h._id, e.target.value)}
                        title="Mark as Pass / Fail / Conditional pass"
                      >
                        {DVP_STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() => openReportUpload(h)}
                      >
                        Upload report
                      </button>
                    </div>
                  </div>
                  {reportHarness && reportHarness._id === h._id && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--color-border)" }}>
                      <div style={{ marginBottom: 12 }}>
                        <label className="form-group__label">Upload report (PDF or sheet: .xlsx, .xls, .csv)</label>
                        <form onSubmit={submitReport} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 400 }}>
                          <input
                            type="file"
                            accept={REPORT_ACCEPT}
                            className="input"
                            onChange={(e) => setReportFile(e.target.files?.[0] || null)}
                          />
                          <input
                            className="input"
                            placeholder="Remarks (optional)"
                            value={reportRemarks}
                            onChange={(e) => setReportRemarks(e.target.value)}
                          />
                          <button type="submit" className="btn btn--primary" disabled={!reportFile || uploading} style={{ alignSelf: "flex-start" }}>
                            {uploading ? "Uploading…" : "Upload"}
                          </button>
                        </form>
                      </div>
                      <div>
                        <span className="form-group__label">Uploaded reports for this harness</span>
                        {reportList.length === 0 ? (
                          <p style={{ color: "var(--color-text-muted)", margin: "8px 0 0", fontSize: "0.875rem" }}>None yet.</p>
                        ) : (
                          <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
                            {reportList.map((r) => (
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
                      </div>
                      <button type="button" className="btn btn--secondary" onClick={closeReportUpload} style={{ marginTop: 12 }}>
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
            <div className="card__header">Write DVP No: {assigning.partNo}</div>
            <div className="card__body">
              <form
                onSubmit={submitAssign}
                className="form-row"
                style={{ alignItems: "center", flexWrap: "wrap" }}
              >
                <div className="form-group" style={{ flex: "1 1 200px", maxWidth: 280 }}>
                  <label className="form-group__label">DVP No</label>
                  <input
                    className="input"
                    placeholder="DVP No"
                    value={dvpNo}
                    onChange={(e) => setDvpNo(e.target.value)}
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
