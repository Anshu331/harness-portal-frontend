import { useEffect, useState } from "react";
import API from "../api.js";
import { baseURL } from "../api.js";

const uploadsBase = (baseURL || "").replace(/\/api\/?$/, "");
const VEHICLE_TYPES = [
  { value: "3W", label: "3-wheeler" },
  { value: "4W", label: "4-wheeler" },
];

export default function ProjectVehiclePage() {
  const [list, setList] = useState([]);
  const [projects, setProjects] = useState([]);
  const [harnesses, setHarnesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ vehicleType: "3W", vehicleName: "", projectId: "", partNo: "", partDescription: "", drawing: null });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingForId, setUploadingForId] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ vehicleName: "", projectId: "", partNo: "", partDescription: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [selectedVehicleKey, setSelectedVehicleKey] = useState("");

  const load = () => {
    setError("");
    Promise.all([
      API.get("/vehicle-details").then((res) => setList(res.data || [])).catch(() => setList([])),
      API.get("/projects").then((res) => setProjects(res.data || [])).catch(() => setProjects([])),
      API.get("/harness").then((res) => setHarnesses(res.data || [])).catch(() => setHarnesses([])),
    ]).finally(() => setLoading(false));
  };

  const harnessesForProject = (projectId) => {
    if (!projectId) return [];
    const id = typeof projectId === "object" ? projectId._id : projectId;
    return harnesses.filter((h) => (h.projectId?._id || h.projectId) === id);
  };

  const getProjectNameFromItem = (item) => {
    if (item.projectId && typeof item.projectId === "object" && item.projectId.vehicleModel)
      return item.projectId.vehicleModel;
    const id = item.projectId?._id || item.projectId;
    if (id) {
      const p = projects.find((x) => String(x._id) === String(id));
      if (p) return p.vehicleModel || p._id;
    }
    return "";
  };
  const projectName = (item) => {
    const proj = getProjectNameFromItem(item);
    const model = item.vehicleName || "";
    if (proj && model) return `${proj} / ${model}`;
    if (proj) return proj;
    if (model) return model;
    return "—";
  };
  const selectedProjectLabel = (projectId) => {
    if (!projectId) return null;
    const p = projects.find((x) => String(x._id) === String(projectId));
    return p ? (p.vehicleModel || p._id) : null;
  };

  useEffect(() => {
    load();
  }, []);

  const uniqueVehicleModels = (() => {
    const seen = new Set();
    const out = [];
    list.forEach((item) => {
      const projId = item.projectId?._id || item.projectId || "";
      const model = item.vehicleName || "";
      const key = `${projId}__${model}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ projectId: projId, vehicleName: model, label: projectName(item), key });
    });
    return out;
  })();

  const partsForSelectedVehicle = selectedVehicleKey
    ? list.filter((item) => {
        const projId = item.projectId?._id || item.projectId || "";
        const model = item.vehicleName || "";
        return `${projId}__${model}` === selectedVehicleKey;
      })
    : [];

  const openForm = (vehicleType) => {
    setForm({ vehicleType: vehicleType || "3W", vehicleName: "", projectId: "", partNo: "", partDescription: "", drawing: null });
    setFormOpen(true);
  };
  const closeForm = () => {
    setFormOpen(false);
    setForm({ vehicleType: "3W", vehicleName: "", projectId: "", partNo: "", partDescription: "", drawing: null });
  };

  const onProjectSelect = (e) => {
    setForm((f) => ({ ...f, projectId: e.target.value || "" }));
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setEditForm({
      vehicleName: item.vehicleName || "",
      projectId: item.projectId?._id || item.projectId || "",
      partNo: item.partNo || "",
      partDescription: item.partDescription || "",
    });
  };
  const closeEdit = () => {
    setEditingItem(null);
    setEditForm({ vehicleName: "", projectId: "", partNo: "", partDescription: "" });
  };
  const onEditProjectSelect = (e) => {
    setEditForm((f) => ({ ...f, projectId: e.target.value || "" }));
  };
  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    setError("");
    setEditSaving(true);
    try {
      await API.patch(`/vehicle-details/${editingItem._id}`, {
        vehicleName: editForm.vehicleName.trim(),
        projectId: editForm.projectId || null,
        partNo: editForm.partNo.trim(),
        partDescription: editForm.partDescription.trim(),
      });
      closeEdit();
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || "Update failed");
    } finally {
      setEditSaving(false);
    }
  };

  const submitCreate = async (e) => {
    e.preventDefault();
    if (!form.partNo.trim()) {
      setError("Part no is required");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("vehicleType", form.vehicleType);
      fd.append("vehicleName", form.vehicleName.trim());
      if (form.projectId) fd.append("projectId", form.projectId);
      fd.append("partNo", form.partNo.trim());
      fd.append("partDescription", form.partDescription.trim());
      if (form.drawing) fd.append("drawing", form.drawing);
      await API.post("/vehicle-details", fd);
      closeForm();
      load();
    } catch (err) {
      const data = err.response?.data;
      const msg = typeof data === "string" && data.includes("Cannot POST")
        ? "Backend route not found. Restart the backend server (npm start in backend folder) and try again."
        : (data?.message || data || "Failed to create");
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const uploadDrawing = async (id, file) => {
    if (!id || !file) return;
    setError("");
    setUploadingForId(id);
    try {
      const fd = new FormData();
      fd.append("drawing", file);
      await API.post(`/vehicle-details/${id}/drawing`, fd);
      const fileInput = document.getElementById(`drawing-upload-${id}`);
      if (fileInput) fileInput.value = "";
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || "Upload failed");
    } finally {
      setUploadingForId(null);
    }
  };

  const triggerUpload = (id) => {
    const el = document.getElementById(`drawing-upload-${id}`);
    if (el) el.click();
  };

  const onDrawingSelected = (id, e) => {
    const file = e.target.files?.[0];
    if (file) uploadDrawing(id, file);
  };

  const deleteItem = async (id) => {
    if (!confirm("Delete this vehicle detail?")) return;
    setError("");
    try {
      await API.delete(`/vehicle-details/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || "Delete failed");
    }
  };

  const drawingFileName = (url) => (url ? url.split("/").pop() : null);

  if (loading) {
    return (
      <div className="page">
        <div className="loading">Loading…</div>
      </div>
    );
  }

  const selectedVehicleLabel = uniqueVehicleModels.find((v) => v.key === selectedVehicleKey)?.label || selectedVehicleKey;

  return (
    <div className="page">
      <section className="section">
        <h2 className="section__title">Projects details</h2>
        <p style={{ color: "var(--color-text-muted)", marginBottom: 20, fontSize: "0.9375rem" }}>
          Add vehicle details (project, model, parts). Select a vehicle/model below to see all parts used in it.
        </p>

        {error && (
          <div className="alert alert--error" style={{ marginBottom: 20 }}>
            {error}
          </div>
        )}

        {formOpen && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card__header">Add vehicle detail</div>
            <div className="card__body">
              <form onSubmit={submitCreate} style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 480 }}>
                <div className="form-group">
                  <label className="form-group__label">Segment</label>
                  <select
                    className="select"
                    value={form.vehicleType}
                    onChange={(e) => setForm((f) => ({ ...f, vehicleType: e.target.value }))}
                  >
                    {VEHICLE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-group__label">Project</label>
                  <select
                    className="select"
                    value={form.projectId}
                    onChange={onProjectSelect}
                  >
                    <option value="">No project</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.vehicleModel || p._id}
                      </option>
                    ))}
                  </select>
                  {selectedProjectLabel(form.projectId) && (
                    <p style={{ margin: "6px 0 0", fontSize: "0.875rem" }}>
                      <strong>Selected project:</strong> {selectedProjectLabel(form.projectId)}
                    </p>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-group__label">Project / Model</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, minWidth: 80, color: "var(--color-primary, #2563eb)" }}>
                      {selectedProjectLabel(form.projectId) || "—"}
                    </span>
                    <span style={{ color: "var(--color-text-muted)" }}>/</span>
                    <input
                      className="input"
                      value={form.vehicleName}
                      onChange={(e) => setForm((f) => ({ ...f, vehicleName: e.target.value }))}
                      placeholder="Model name"
                      style={{ flex: "1 1 200px", maxWidth: 280 }}
                    />
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                    Shows as: <strong>{selectedProjectLabel(form.projectId) || "—"}{form.vehicleName ? ` / ${form.vehicleName}` : ""}</strong>
                  </p>
                </div>
                <div className="form-group">
                  <label className="form-group__label">Part no *</label>
                  <input
                    className="input"
                    value={form.partNo}
                    onChange={(e) => setForm((f) => ({ ...f, partNo: e.target.value }))}
                    placeholder="Part number"
                  />
                </div>
                <div className="form-group">
                  <label className="form-group__label">Description</label>
                  <input
                    className="input"
                    value={form.partDescription}
                    onChange={(e) => setForm((f) => ({ ...f, partDescription: e.target.value }))}
                    placeholder="Description"
                  />
                </div>
                <div className="form-group">
                  <label className="form-group__label">Drawing (PDF, optional)</label>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="input"
                    onChange={(e) => setForm((f) => ({ ...f, drawing: e.target.files?.[0] || null }))}
                  />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button type="submit" className="btn btn--primary" disabled={submitting}>
                    {submitting ? "Creating…" : "Create"}
                  </button>
                  <button type="button" className="btn btn--secondary" onClick={closeForm}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {!formOpen && (
          <button type="button" className="btn btn--primary" onClick={() => openForm()} style={{ marginBottom: 24 }}>
            Add vehicle detail
          </button>
        )}

        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card__header">Vehicle and model</div>
          <div className="card__body">
            <div className="form-group" style={{ maxWidth: 360 }}>
              <label className="form-group__label">Select vehicle / model to see all parts used</label>
              <select
                className="select"
                value={selectedVehicleKey}
                onChange={(e) => setSelectedVehicleKey(e.target.value)}
              >
                <option value="">— Select vehicle and model —</option>
                {uniqueVehicleModels.map((v) => (
                  <option key={v.key} value={v.key}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            {selectedVehicleKey && (
              <div style={{ marginTop: 16 }}>
                <h4 style={{ marginBottom: 12, fontSize: "1rem" }}>Parts used in {selectedVehicleLabel}</h4>
                {partsForSelectedVehicle.length === 0 ? (
                  <p style={{ color: "var(--color-text-muted)", margin: 0 }}>No parts added yet for this vehicle/model.</p>
                ) : (
                  <div className="table-wrap">
                    <table className="tracking-table">
                      <thead>
                        <tr>
                          <th>Part no</th>
                          <th>Description</th>
                          <th>Drawing</th>
                          <th style={{ width: 220 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {partsForSelectedVehicle.map((item) => (
                          <tr key={item._id}>
                            <td>{item.partNo}</td>
                            <td>{item.partDescription || "—"}</td>
                            <td>
                              {item.drawingFileUrl ? (
                                <a href={`${uploadsBase}/${item.drawingFileUrl}`} target="_blank" rel="noopener noreferrer">
                                  {drawingFileName(item.drawingFileUrl)}
                                </a>
                              ) : (
                                <span style={{ color: "var(--color-text-muted)" }}>No drawing</span>
                              )}
                            </td>
                            <td>
                              <input
                                id={`drawing-upload-${item._id}`}
                                type="file"
                                accept=".pdf,application/pdf"
                                style={{ display: "none" }}
                                onChange={(e) => onDrawingSelected(item._id, e)}
                              />
                              <button type="button" className="btn btn--secondary" style={{ marginRight: 6 }} onClick={() => openEdit(item)}>
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn--secondary"
                                style={{ marginRight: 6 }}
                                onClick={() => triggerUpload(item._id)}
                                disabled={uploadingForId === item._id}
                              >
                                {uploadingForId === item._id ? "…" : item.drawingFileUrl ? "Replace PDF" : "Upload PDF"}
                              </button>
                              {item.drawingFileUrl && (
                                <a
                                  href={`${uploadsBase}/${item.drawingFileUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn--secondary"
                                  style={{ marginRight: 6 }}
                                >
                                  Download
                                </a>
                              )}
                              <button type="button" className="btn btn--danger" onClick={() => deleteItem(item._id)}>
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {editingItem && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card__header">Edit: {projectName(editingItem)}</div>
            <div className="card__body">
              <form onSubmit={submitEdit} style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 480 }}>
                <div className="form-group">
                  <label className="form-group__label">Project</label>
                  <select
                    className="select"
                    value={editForm.projectId}
                    onChange={onEditProjectSelect}
                  >
                    <option value="">No project</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.vehicleModel || p._id}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-group__label">Project / Model</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, minWidth: 80 }}>
                      {selectedProjectLabel(editForm.projectId) || "—"}
                    </span>
                    <span style={{ color: "var(--color-text-muted)" }}>/</span>
                    <input
                      className="input"
                      value={editForm.vehicleName}
                      onChange={(e) => setEditForm((f) => ({ ...f, vehicleName: e.target.value }))}
                      placeholder="Model name"
                      style={{ flex: "1 1 200px", maxWidth: 280 }}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-group__label">Part no *</label>
                  <input
                    className="input"
                    value={editForm.partNo}
                    onChange={(e) => setEditForm((f) => ({ ...f, partNo: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-group__label">Description</label>
                  <input
                    className="input"
                    value={editForm.partDescription}
                    onChange={(e) => setEditForm((f) => ({ ...f, partDescription: e.target.value }))}
                  />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button type="submit" className="btn btn--primary" disabled={editSaving}>
                    {editSaving ? "Saving…" : "Save"}
                  </button>
                  <button type="button" className="btn btn--secondary" onClick={closeEdit}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
