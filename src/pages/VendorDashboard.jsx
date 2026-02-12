import { useEffect, useState } from "react";
import API from "../api.js";
import { baseURL } from "../api.js";
import DashboardLayout from "../components/DashboardLayout.jsx";

const uploadsBase = (baseURL || "").replace(/\/api\/?$/, "");

export default function VendorDashboard() {
  const [harnesses, setHarnesses] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dispatching, setDispatching] = useState(null);
  const [dispatchForm, setDispatchForm] = useState({ transporter: "", lrNo: "", eta: "" });
  const [etaHarness, setEtaHarness] = useState(null);
  const [etaValue, setEtaValue] = useState("");
  const [photoHarness, setPhotoHarness] = useState(null);
  const [photoReports, setPhotoReports] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoRemarks, setPhotoRemarks] = useState("");
  const [pdiHarness, setPdiHarness] = useState(null);
  const [pdiReports, setPdiReports] = useState([]);
  const [pdiFile, setPdiFile] = useState(null);
  const [pdiRemarks, setPdiRemarks] = useState("");
  const [uploading, setUploading] = useState(false);

  const load = () => {
    setError("");
    Promise.all([
      API.get("/harness/vendor/me").then((res) => setHarnesses(res.data)).catch(() => setHarnesses([])),
      API.get("/shipment").then((res) => setShipments(res.data)).catch(() => setShipments([])),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!photoHarness) {
      setPhotoReports([]);
      return;
    }
    API.get(`/report/harness/${photoHarness._id}`)
      .then((res) => setPhotoReports((res.data || []).filter((r) => (r.type || "").toUpperCase() === "PHOTO")))
      .catch(() => setPhotoReports([]));
  }, [photoHarness]);

  useEffect(() => {
    if (!pdiHarness) {
      setPdiReports([]);
      return;
    }
    API.get(`/report/harness/${pdiHarness._id}`)
      .then((res) => setPdiReports((res.data || []).filter((r) => (r.type || "").toUpperCase() === "PDI_REPORT")))
      .catch(() => setPdiReports([]));
  }, [pdiHarness]);

  const openDispatch = (h) => setDispatching(h);
  const closeDispatch = () => {
    setDispatching(null);
    setDispatchForm({ transporter: "", lrNo: "", eta: "" });
  };

  const submitDispatch = async (e) => {
    e.preventDefault();
    if (!dispatching) return;
    setError("");
    try {
      await API.post(`/shipment/dispatch/${dispatching._id}`, {
        transporter: dispatchForm.transporter || "N/A",
        lrNo: dispatchForm.lrNo || "N/A",
        eta: dispatchForm.eta || undefined,
      });
      closeDispatch();
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || "Dispatch failed");
    }
  };

  const openEta = (h) => {
    setEtaHarness(h);
    setEtaValue(h.vendorEta ? new Date(h.vendorEta).toISOString().slice(0, 10) : "");
  };
  const closeEta = () => {
    setEtaHarness(null);
    setEtaValue("");
  };
  const submitEta = async (e) => {
    e.preventDefault();
    if (!etaHarness) return;
    setError("");
    try {
      await API.patch(`/harness/vendor-eta/${etaHarness._id}`, { vendorEta: etaValue || null });
      closeEta();
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || "Set ETA failed");
    }
  };

  const openPhotos = (h) => {
    setPhotoHarness(h);
    setPhotoFile(null);
    setPhotoRemarks("");
  };
  const closePhotos = () => {
    setPhotoHarness(null);
    setPhotoFile(null);
    setPhotoRemarks("");
  };
  const submitPhoto = async (e) => {
    e.preventDefault();
    if (!photoHarness || !photoFile) return;
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", photoFile);
      formData.append("type", "PHOTO");
      if (photoRemarks.trim()) formData.append("remarks", photoRemarks.trim());
      await API.post(`/report/upload/${photoHarness._id}`, formData);
      setPhotoFile(null);
      setPhotoRemarks("");
      API.get(`/report/harness/${photoHarness._id}`)
        .then((res) => setPhotoReports((res.data || []).filter((r) => (r.type || "").toUpperCase() === "PHOTO")))
        .catch(() => {});
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const openPdi = (h) => {
    setPdiHarness(h);
    setPdiFile(null);
    setPdiRemarks("");
  };
  const closePdi = () => {
    setPdiHarness(null);
    setPdiFile(null);
    setPdiRemarks("");
  };
  const submitPdi = async (e) => {
    e.preventDefault();
    if (!pdiHarness || !pdiFile) return;
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", pdiFile);
      formData.append("type", "PDI_REPORT");
      if (pdiRemarks.trim()) formData.append("remarks", pdiRemarks.trim());
      await API.post(`/report/upload/${pdiHarness._id}`, formData);
      setPdiFile(null);
      setPdiRemarks("");
      API.get(`/report/harness/${pdiHarness._id}`)
        .then((res) => setPdiReports((res.data || []).filter((r) => (r.type || "").toUpperCase() === "PDI_REPORT")))
        .catch(() => {});
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || "PDI upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Vendor Portal">
        <div className="loading">Loading…</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Vendor Portal">
      <div className="page">
        {error && (
          <div className="alert alert--error" style={{ marginBottom: 20 }}>
            {error}
          </div>
        )}

        <section className="section">
          <h3 className="section__title">Harnesses assigned to you</h3>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginBottom: 16 }}>
            You only see harnesses assigned to you. Set ETA, upload photos and PDI report (PDF) for each.
          </p>
          {harnesses.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", padding: 20 }}>No harnesses assigned.</p>
          ) : (
            <ul className="list">
              {harnesses.map((h) => (
                <li key={h._id} className="list-item">
                  <div className="list-item__main">
                    <div className="list-item__title">
                      {h.partNo} – {h.partDescription}
                    </div>
                    <div className="list-item__meta">
                      {h.projectId && h.projectId.vehicleModel}
                      <span className="badge badge--default" style={{ marginLeft: 8 }}>
                        {h.status}
                      </span>
                      {h.vendorEta && (
                        <span style={{ marginLeft: 8 }}>
                          ETA: {new Date(h.vendorEta).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => openEta(h)}
                    >
                      {h.vendorEta ? "Change ETA" : "Set ETA"}
                    </button>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => openPhotos(h)}
                    >
                      Upload photos
                    </button>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => openPdi(h)}
                    >
                      Upload PDI report
                    </button>
                    {h.status === "DEVELOPMENT" && (
                      <button
                        type="button"
                        className="btn btn--primary"
                        onClick={() => openDispatch(h)}
                      >
                        Dispatch
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {etaHarness && (
          <section className="section card">
            <div className="card__header">Set ETA: {etaHarness.partNo}</div>
            <div className="card__body">
              <form onSubmit={submitEta} className="form-row" style={{ alignItems: "flex-end", flexWrap: "wrap" }}>
                <div className="form-group" style={{ flex: "1 1 200px", maxWidth: 280 }}>
                  <label className="form-group__label">Expected date</label>
                  <input
                    type="date"
                    className="input"
                    value={etaValue}
                    onChange={(e) => setEtaValue(e.target.value)}
                  />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button type="submit" className="btn btn--primary">Save ETA</button>
                  <button type="button" className="btn btn--secondary" onClick={closeEta}>Cancel</button>
                </div>
              </form>
            </div>
          </section>
        )}

        {photoHarness && (
          <section className="section card">
            <div className="card__header">Upload photos: {photoHarness.partNo}</div>
            <div className="card__body">
              <form onSubmit={submitPhoto} style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
                <div className="form-group">
                  <label className="form-group__label">Photo (image file)</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="input"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-group__label">Remarks (optional)</label>
                  <input
                    className="input"
                    placeholder="Remarks"
                    value={photoRemarks}
                    onChange={(e) => setPhotoRemarks(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn--primary" disabled={!photoFile || uploading}>
                  {uploading ? "Uploading…" : "Upload photo"}
                </button>
              </form>
              <h4 style={{ marginBottom: 10, fontSize: "0.9375rem", fontWeight: 600 }}>Photos for this harness</h4>
              {photoReports.length === 0 ? (
                <p style={{ color: "var(--color-text-muted)", margin: 0 }}>No photos uploaded yet.</p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  {photoReports.map((r) => (
                    <div key={r._id} style={{ border: "1px solid var(--color-border)", borderRadius: 8, overflow: "hidden", maxWidth: 200 }}>
                      <a href={`${uploadsBase}/${r.fileUrl}`} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
                        <img src={`${uploadsBase}/${r.fileUrl}`} alt="" style={{ width: "100%", height: 140, objectFit: "cover" }} />
                      </a>
                      {r.remarks && <p style={{ padding: 8, margin: 0, fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>{r.remarks}</p>}
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 16 }}>
                <button type="button" className="btn btn--secondary" onClick={closePhotos}>Close</button>
              </div>
            </div>
          </section>
        )}

        {pdiHarness && (
          <section className="section card">
            <div className="card__header">Upload PDI report (PDF): {pdiHarness.partNo}</div>
            <div className="card__body">
              <form onSubmit={submitPdi} style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
                <div className="form-group">
                  <label className="form-group__label">PDI report (PDF)</label>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="input"
                    onChange={(e) => setPdiFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-group__label">Remarks (optional)</label>
                  <input
                    className="input"
                    placeholder="Remarks"
                    value={pdiRemarks}
                    onChange={(e) => setPdiRemarks(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn--primary" disabled={!pdiFile || uploading}>
                  {uploading ? "Uploading…" : "Upload PDI report"}
                </button>
              </form>
              <h4 style={{ marginBottom: 10, fontSize: "0.9375rem", fontWeight: 600 }}>PDI reports for this harness</h4>
              {pdiReports.length === 0 ? (
                <p style={{ color: "var(--color-text-muted)", margin: 0 }}>No PDI reports uploaded yet.</p>
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
              <div style={{ marginTop: 16 }}>
                <button type="button" className="btn btn--secondary" onClick={closePdi}>Close</button>
              </div>
            </div>
          </section>
        )}

        {dispatching && (
          <section className="section card">
            <div className="card__header">Dispatch: {dispatching.partNo}</div>
            <div className="card__body">
              <form
                onSubmit={submitDispatch}
                style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 360 }}
              >
                <div className="form-group">
                  <label className="form-group__label">Transporter</label>
                  <input
                    className="input"
                    placeholder="Transporter"
                    value={dispatchForm.transporter}
                    onChange={(e) => setDispatchForm((p) => ({ ...p, transporter: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-group__label">LR No</label>
                  <input
                    className="input"
                    placeholder="LR No"
                    value={dispatchForm.lrNo}
                    onChange={(e) => setDispatchForm((p) => ({ ...p, lrNo: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-group__label">ETA</label>
                  <input
                    type="date"
                    className="input"
                    value={dispatchForm.eta}
                    onChange={(e) => setDispatchForm((p) => ({ ...p, eta: e.target.value }))}
                  />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button type="submit" className="btn btn--primary">Confirm dispatch</button>
                  <button type="button" className="btn btn--secondary" onClick={closeDispatch}>Cancel</button>
                </div>
              </form>
            </div>
          </section>
        )}

        <section className="section">
          <h3 className="section__title">Your shipments</h3>
          {shipments.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", padding: 20 }}>No shipments yet.</p>
          ) : (
            <ul className="list">
              {shipments.map((s) => (
                <li key={s._id} className="list-item">
                  <div className="list-item__main">
                    <div className="list-item__title">
                      {s.harnessId?.partNo || s.harnessId}
                    </div>
                    <div className="list-item__meta">
                      {s.transporter} · LR: {s.lrNo}
                      {s.eta ? ` · ETA: ${new Date(s.eta).toLocaleDateString()}` : ""}
                      <span
                        className={`badge ${s.status === "RECEIVED" ? "badge--success" : "badge--warning"}`}
                        style={{ marginLeft: 8 }}
                      >
                        {s.status}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
