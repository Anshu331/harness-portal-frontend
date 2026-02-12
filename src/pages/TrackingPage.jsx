import { useEffect, useState } from "react";
import API from "../api.js";

function formatDate(d) {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const RECEIVED_AT_OPTIONS = [
  { value: "PLANT", label: "Plant" },
  { value: "R&D_CENTRE", label: "R&D Centre" },
];

export default function TrackingPage() {
  const [list, setList] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingId, setMarkingId] = useState(null);
  const [receivingShipment, setReceivingShipment] = useState(null);
  const [receivedAt, setReceivedAt] = useState("");
  const [receiveSubmitting, setReceiveSubmitting] = useState(false);

  const load = () => {
    setError("");
    return Promise.all([
      API.get("/tracking").then((res) => setList(res.data)).catch(() => setList([])),
      API.get("/auth/users")
        .then((res) => setVendors(res.data.filter((u) => u.role === "VENDOR")))
        .catch(() => setVendors([])),
      API.get("/shipment").then((res) => setShipments(res.data || [])).catch(() => setShipments([])),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const markSampleReceived = async (harnessId) => {
    setError("");
    setMarkingId(harnessId);
    try {
      await API.patch(`/sample-received/${harnessId}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || "Failed to mark sample received");
    } finally {
      setMarkingId(null);
    }
  };

  const openReceive = (s) => {
    setReceivingShipment(s);
    setReceivedAt("");
  };
  const closeReceive = () => {
    setReceivingShipment(null);
    setReceivedAt("");
  };
  const submitReceive = async (e) => {
    e.preventDefault();
    if (!receivingShipment || !receivedAt) return;
    setError("");
    setReceiveSubmitting(true);
    try {
      await API.post(`/shipment/receive/${receivingShipment._id}`, { receivedAt });
      closeReceive();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || "Failed to mark shipment received");
    } finally {
      setReceiveSubmitting(false);
    }
  };

  const filtered =
    selectedVendorId === ""
      ? list
      : list.filter((h) => h.assignedVendors?.some((v) => (v._id || v) === selectedVendorId));

  const vendorLabel = (v, index) => v?.name || v?.email || `Vendor ${index + 1}`;

  if (loading) {
    return <div className="loading">Loading…</div>;
  }

  return (
    <div className="page">
      <section className="section">
        <h3 className="section__title">Tracking – released harnesses</h3>
        <p style={{ color: "var(--color-text-muted)", marginBottom: 16, fontSize: "0.9375rem" }}>
          Harnesses with drawings release date set. Filter by assigned vendor below.
        </p>

        <div className="form-group" style={{ maxWidth: 280, marginBottom: 20 }}>
          <label className="form-group__label">Filter by vendor (assigned harness)</label>
          <select
            className="select"
            value={selectedVendorId}
            onChange={(e) => setSelectedVendorId(e.target.value)}
          >
            <option value="">All vendors</option>
            {vendors.map((v, i) => (
              <option key={v._id} value={v._id}>
                {vendorLabel(v, i)}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="alert alert--error" style={{ marginBottom: 20 }}>
            {error}
          </div>
        )}

        {filtered.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)", padding: 20 }}>
            {list.length === 0
              ? "No released harnesses yet. Set a drawings release date on the Dashboard to release harnesses."
              : "No released harnesses for the selected vendor."}
          </p>
        ) : (
          <div className="table-wrap">
            <table className="tracking-table">
              <thead>
                <tr>
                  <th>Part No</th>
                  <th>Part description</th>
                  <th>Project</th>
                  <th>Assigned vendor(s)</th>
                  <th>Drawings release date</th>
                  <th>ETA (vendor)</th>
                  <th>Sample received</th>
                  <th>Status</th>
                  <th>DVP / TNV</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((h) => (
                  <tr key={h._id}>
                    <td>{h.partNo || "—"}</td>
                    <td>{h.partDescription || "—"}</td>
                    <td>{h.projectId?.vehicleModel ? `${h.projectId.vehicleModel} – ${h.projectId.platform || ""}` : "—"}</td>
                    <td>
                      {h.assignedVendors?.length
                        ? h.assignedVendors.map((v, i) => vendorLabel(v, i)).join(", ")
                        : "—"}
                    </td>
                    <td>{formatDate(h.drawingsReleaseDate)}</td>
                    <td>{formatDate(h.latestShipment?.eta)}</td>
                    <td>
                      {h.sampleReceived ? (
                        <span className="badge badge--success" title={formatDate(h.sampleReceivedDate)}>
                          Received {formatDate(h.sampleReceivedDate)}
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn--primary"
                          disabled={markingId === h._id}
                          onClick={() => markSampleReceived(h._id)}
                        >
                          {markingId === h._id ? "…" : "Mark sample received"}
                        </button>
                      )}
                    </td>
                    <td>
                      <span className="badge badge--default">{h.status || "—"}</span>
                    </td>
                    <td>
                      {[h.dvpNo && `DVP: ${h.dvpNo}`, h.tnvDocketNo && `TNV: ${h.tnvDocketNo}`]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="section">
        <h3 className="section__title">Shipments – receive</h3>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginBottom: 16 }}>
          Only Admin can mark a shipment as received. Choose where it was received: Plant or R&D Centre.
        </p>
        {shipments.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)", padding: 20 }}>No shipments.</p>
        ) : (
          <ul className="list">
            {shipments.map((s) => (
              <li key={s._id} className="list-item">
                <div className="list-item__main">
                  <div className="list-item__title">
                    {s.harnessId?.partNo || s.harnessId} · {s.transporter} · LR: {s.lrNo}
                  </div>
                  <div className="list-item__meta">
                    <span className={`badge ${s.status === "RECEIVED" ? "badge--success" : "badge--warning"}`}>
                      {s.status}
                    </span>
                    {s.status === "RECEIVED" && s.receivedAt && (
                      <span style={{ marginLeft: 8 }}>
                        Received at: {s.receivedAt === "R&D_CENTRE" ? "R&D Centre" : s.receivedAt}
                      </span>
                    )}
                  </div>
                </div>
                {s.status === "IN TRANSIT" && (
                  <>
                    {receivingShipment?._id === s._id ? (
                      <form onSubmit={submitReceive} style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                        <select
                          className="select"
                          value={receivedAt}
                          onChange={(e) => setReceivedAt(e.target.value)}
                          required
                          style={{ minWidth: 140 }}
                        >
                          <option value="">Select…</option>
                          {RECEIVED_AT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <button type="submit" className="btn btn--primary" disabled={!receivedAt || receiveSubmitting}>
                          {receiveSubmitting ? "…" : "Confirm received"}
                        </button>
                        <button type="button" className="btn btn--secondary" onClick={closeReceive}>
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <button type="button" className="btn btn--primary" onClick={() => openReceive(s)}>
                        Mark received
                      </button>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
