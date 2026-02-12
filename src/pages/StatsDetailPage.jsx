import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../api.js";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const FILTER_LABELS = {
  total: "Total harness",
  development: "Development",
  dispatched: "Dispatched",
  received: "Received",
};

export default function StatsDetailPage() {
  const { filter } = useParams();
  const [harnesses, setHarnesses] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const validFilter = ["total", "development", "dispatched", "received"].includes(filter) ? filter : "total";

  useEffect(() => {
    setError("");
    if (validFilter === "dispatched" || validFilter === "received") {
      API.get("/shipment")
        .then((res) =>
          setShipments(
            (res.data || []).filter((s) =>
              validFilter === "dispatched" ? s.status === "IN TRANSIT" : s.status === "RECEIVED"
            )
          )
        )
        .catch(() => setShipments([]))
        .finally(() => setLoading(false));
    } else {
      API.get("/harness")
        .then((res) => {
          const list = res.data || [];
          setHarnesses(
            validFilter === "development" ? list.filter((h) => h.status === "DEVELOPMENT") : list
          );
        })
        .catch(() => setHarnesses([]))
        .finally(() => setLoading(false));
    }
  }, [validFilter]);

  if (loading) {
    return <div className="loading">Loading…</div>;
  }

  const title = FILTER_LABELS[validFilter] || "Details";

  return (
    <div className="page">
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Link to="/" className="btn btn--secondary">
          ← Back to Dashboard
        </Link>
        <h3 className="section__title" style={{ margin: 0 }}>
          {title} – all details
        </h3>
      </div>

      {error && (
        <div className="alert alert--error" style={{ marginBottom: 20 }}>
          {error}
        </div>
      )}

      {(validFilter === "total" || validFilter === "development") && (
        <section className="section">
          {harnesses.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", padding: 20 }}>No harnesses.</p>
          ) : (
            <div className="table-wrap">
              <table className="tracking-table">
                <thead>
                  <tr>
                    <th>Part No</th>
                    <th>Part description</th>
                    <th>Project</th>
                    <th>Status</th>
                    <th>Assigned vendors</th>
                    <th>DVP No</th>
                    <th>TNV Docket</th>
                    <th>Drawings release</th>
                    <th>Vendor ETA</th>
                    <th>DVP status</th>
                    <th>TNV status</th>
                  </tr>
                </thead>
                <tbody>
                  {harnesses.map((h) => (
                    <tr key={h._id}>
                      <td>{h.partNo || "—"}</td>
                      <td>{h.partDescription || "—"}</td>
                      <td>
                        {h.projectId
                          ? `${h.projectId.vehicleModel || ""} ${h.projectId.platform ? "– " + h.projectId.platform : ""}`.trim() || "—"
                          : "—"}
                      </td>
                      <td>
                        <span className="badge badge--default">{h.status || "—"}</span>
                      </td>
                      <td>
                        {h.assignedVendors?.length
                          ? h.assignedVendors.map((v) => v.name || v.email).join(", ")
                          : "—"}
                      </td>
                      <td>{h.dvpNo || "—"}</td>
                      <td>{h.tnvDocketNo || "—"}</td>
                      <td>{formatDate(h.drawingsReleaseDate)}</td>
                      <td>{formatDate(h.vendorEta)}</td>
                      <td>{h.dvpStatus || "—"}</td>
                      <td>{h.tnvStatus || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {(validFilter === "dispatched" || validFilter === "received") && (
        <section className="section">
          {shipments.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", padding: 20 }}>
              No {validFilter === "dispatched" ? "dispatched" : "received"} shipments.
            </p>
          ) : (
            <div className="table-wrap">
              <table className="tracking-table">
                <thead>
                  <tr>
                    <th>Harness (Part No)</th>
                    <th>Part description</th>
                    <th>Project</th>
                    <th>Vendor</th>
                    <th>Transporter</th>
                    <th>LR No</th>
                    <th>Dispatch date</th>
                    <th>ETA</th>
                    <th>Received date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.map((s) => (
                    <tr key={s._id}>
                      <td>{s.harnessId?.partNo || "—"}</td>
                      <td>{s.harnessId?.partDescription || "—"}</td>
                      <td>
                        {s.harnessId?.projectId && typeof s.harnessId.projectId === "object"
                          ? (s.harnessId.projectId.vehicleModel || "").trim() || "—"
                          : "—"}
                      </td>
                      <td>
                        {s.vendor
                          ? typeof s.vendor === "object"
                            ? s.vendor.name || s.vendor.email || "—"
                            : "—"
                          : "—"}
                      </td>
                      <td>{s.transporter || "—"}</td>
                      <td>{s.lrNo || "—"}</td>
                      <td>{formatDate(s.dispatchDate)}</td>
                      <td>{formatDate(s.eta)}</td>
                      <td>{formatDate(s.receivedDate)}</td>
                      <td>
                        <span className={`badge ${s.status === "RECEIVED" ? "badge--success" : "badge--warning"}`}>
                          {s.status || "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
