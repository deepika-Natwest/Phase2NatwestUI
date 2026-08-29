import React, { useEffect, useMemo, useRef, useState } from "react";
import Layout from "../../components/admin/Layout";
import { createProgram, deleteProgram } from "../../features/programs/programService";
import { getUserRole } from "../../utils/tokenUtils";
import { hasAnyRole } from "../../utils/roleUtils";
import { ROLES } from "../../constants/roles";
import api from "../../services/api";

const today = new Date().toISOString().split("T")[0];

function AddProgram() {
  const role = getUserRole();

  const [programs, setPrograms] = useState([]);
  const [capabilities, setCapabilities] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [users, setUsers] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "", capabilityId: "", franchiseId: "",
    description: "", date: today, isActive: true,
  });

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [detailProgram, setDetailProgram] = useState(null);

  const selectAllRef = useRef(null);

  const loadData = () => {
    const toArr = (d, key) =>
      Array.isArray(d) ? d : (key && Array.isArray(d?.[key]) ? d[key] : Array.isArray(d?.data) ? d.data : []);

    api.get("/programs")
      .then((res) => setPrograms(toArr(res.data, "programs")))
      .catch((err) => console.error("Programs load failed:", err));
    api.get("/capabilities")
      .then((res) => setCapabilities(toArr(res.data, "capabilities")))
      .catch((err) => console.error("Capabilities load failed:", err));
    api.get("/franchises")
      .then((res) => setFranchises(toArr(res.data, "franchises")))
      .catch((err) => console.error("Franchises load failed:", err));
    api.get("/users?limit=1000")
      .then((res) => setUsers(toArr(res.data, "users").filter((u) => u.role?.toUpperCase() !== "ADMIN")))
      .catch((err) => console.error("Users load failed:", err));
  };

  useEffect(() => { loadData(); }, []);

  // Group programs by name; within each group sort newest first
  const groupedPrograms = useMemo(() => {
    const groups = {};
    programs.forEach((p) => {
      const key = p.name.toLowerCase().trim();
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    Object.values(groups).forEach((arr) =>
      arr.sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    );
    // Flatten: each entry tagged with isLatest + history index
    return Object.values(groups).flatMap((arr) =>
      arr.map((p, i) => ({ ...p, isLatest: i === 0, historyIndex: i + 1, totalHistory: arr.length }))
    );
  }, [programs]);

  // Unmanaged programs from Teams
  const managedNames = useMemo(
    () => new Set(programs.map((p) => p.name.toLowerCase().trim())),
    [programs]
  );
  const unmanagedPrograms = useMemo(
    () =>
      [...new Set(
        users
          .filter((u) => u.role?.toUpperCase() !== "ADMIN" && u.projectName)
          .map((u) => u.projectName)
      )].filter((name) => !managedNames.has(name.toLowerCase().trim())),
    [users, managedNames]
  );

  // Status is derived entirely from user assignments (ignores stored isActive flag):
  // • Has ≥1 user assigned  → Active
  // • No users assigned     → Inactive
  // • No BU/SBU configured  → Unconfigured
  const assignedProgramNames = useMemo(
    () => new Set(users.map((u) => (u.projectName || "").toLowerCase().trim()).filter(Boolean)),
    [users]
  );

  const isEffectivelyActive = (p) => {
    if (!p.capabilityId && !p.franchiseId) return false;
    return assignedProgramNames.has(p.name.toLowerCase().trim());
  };

  const getStatusBadge = (p) => {
    if (!p.capabilityId && !p.franchiseId)
      return <span className="badge bg-secondary">Unconfigured</span>;
    if (assignedProgramNames.has(p.name.toLowerCase().trim()))
      return <span className="badge bg-success">Active</span>;
    return <span className="badge bg-danger">Inactive</span>;
  };

  // Bulk select (over all programs, not grouped)
  const allSelected = programs.length > 0 && selectedIds.size === programs.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < programs.length;
  const selectedCount = selectedIds.size;

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected;
  }, [someSelected]);

  const toggleSelectAll = () =>
    setSelectedIds(allSelected ? new Set() : new Set(programs.map((p) => p.id)));

  const toggleOne = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const [priorComments, setPriorComments] = useState([]);

  const openModal = (prefillName = "") => {
    setFormData({ name: prefillName, capabilityId: "", franchiseId: "", description: "", date: today, isActive: true });
    setPriorComments([]);
    setModalOpen(true);
  };

  // Pre-fill BU/SBU/status from latest entry; description always blank; show old comments
  const openEditModal = (latestEntry) => {
    const allEntries = programs
      .filter((p) => p.name.toLowerCase().trim() === latestEntry.name.toLowerCase().trim())
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    setFormData({
      name:         latestEntry.name,
      capabilityId: latestEntry.capabilityId || "",
      franchiseId:  latestEntry.franchiseId  || "",
      description:  "",
      date:         today,
      isActive:     latestEntry.isActive ?? true,
    });
    setPriorComments(allEntries);
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setPriorComments([]); };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, isActive: formData.isActive === true || formData.isActive === "true" };
    try {
      await createProgram(payload);
      closeModal();
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Could not save program");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    try {
      await deleteProgram(id);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete program");
    }
  };

  const handleBulkDelete = async () => {
    setDeleting(true);
    try {
      await Promise.all([...selectedIds].map((id) => deleteProgram(id)));
      setSelectedIds(new Set());
      setConfirmDelete(false);
      await loadData();
    } finally {
      setDeleting(false);
    }
  };

  const filteredFormFranchises = franchises.filter((f) => f.capabilityId === formData.capabilityId);

  return (
    <Layout>
      {/* Page header */}
      <div className="d-flex justify-content-between align-items-center titleBox">
        <h2>Program Manager</h2>
        {hasAnyRole(role, [ROLES.ADMIN, ROLES.EDITOR]) && (
          <button className="btn btn-primary" onClick={() => openModal()}>+ Add Program Entry</button>
        )}
      </div>

      {/* Bulk action toolbar */}
      {selectedCount > 0 && !confirmDelete && (
        <div className="searchHeadBox p-3 d-flex align-items-center gap-2">
          <span className="me-2 fw-semibold">{selectedCount} selected</span>
          {hasAnyRole(role, [ROLES.ADMIN]) && (
            <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>
              Delete Selected ({selectedCount})
            </button>
          )}
        </div>
      )}

      {/* Bulk delete confirmation */}
      {confirmDelete && (
        <div className="searchHeadBox p-3 d-flex align-items-center gap-2">
          <span className="text-danger fw-bold me-2">
            Permanently delete {selectedCount} entr{selectedCount === 1 ? "y" : "ies"}? This cannot be undone.
          </span>
          <button className="btn btn-danger btn-sm" disabled={deleting} onClick={handleBulkDelete}>
            {deleting ? "Deleting..." : "Confirm Delete"}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setConfirmDelete(false)}>Cancel</button>
        </div>
      )}

      {/* Unmanaged programs from Teams */}
      {unmanagedPrograms.length > 0 && hasAnyRole(role, [ROLES.ADMIN, ROLES.EDITOR]) && (
        <div className="adminContent px-4 pt-3 pb-0">
          <div className="alert alert-warning mb-2">
            <strong>{unmanagedPrograms.length}</strong> program(s) found in Teams data but not yet configured.
          </div>
          <table className="table table-bordered table-sm mb-4" style={{ fontSize: "13px" }}>
            <thead style={{ backgroundColor: "#fff3cd" }}>
              <tr>
                <th>#</th>
                <th>Program Name (from Teams)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {unmanagedPrograms.map((name, idx) => (
                <tr key={name}>
                  <td>{idx + 1}</td>
                  <td><strong>{name}</strong></td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => openModal(name)}>
                      Add Entry
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Main programs table — all entries, grouped by name, newest first */}
      <div className="adminContent p-4">
        <p className="text-muted small mb-2">
          Each row is an immutable entry. New entries are added on top. Latest entry per program is used on the public site.
        </p>
        <table className="table table-bordered">
          <thead>
            <tr>
              <th style={{ width: 40 }}>
                <input type="checkbox" ref={selectAllRef} checked={allSelected} onChange={toggleSelectAll} />
              </th>
              <th>Program Name</th>
              <th>Entry</th>
              <th>BU (Capability)</th>
              <th>SBU (Franchise)</th>
              <th>Description</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {groupedPrograms.length === 0 && (
              <tr><td colSpan="9" className="text-center text-muted py-3">No program entries yet.</td></tr>
            )}
            {groupedPrograms.map((p) => (
              <tr key={p.id} style={p.isLatest ? {} : { backgroundColor: "#fafafa", color: "#888" }}>
                <td>
                  <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleOne(p.id)} />
                </td>
                <td className="fw-semibold">
                  {p.name}
                  {p.isLatest && p.totalHistory > 1 && (
                    <span className="badge bg-primary ms-2" style={{ fontSize: "10px" }}>Latest</span>
                  )}
                </td>
                <td className="text-center">
                  <span className="badge bg-secondary" style={{ fontSize: "10px" }}>
                    #{p.historyIndex} / {p.totalHistory}
                  </span>
                </td>
                <td>{capabilities.find((c) => c.id === p.capabilityId)?.name || "—"}</td>
                <td>{franchises.find((f) => f.id === p.franchiseId)?.name || "—"}</td>
                <td style={{ maxWidth: "200px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {p.description || "—"}
                </td>
                <td style={{ whiteSpace: "nowrap" }}>{p.date || "—"}</td>
                <td>{getStatusBadge(p)}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button className="btn btn-sm btn-info me-1 text-white" onClick={() => setDetailProgram(p)}>Details</button>
                  {p.isLatest && hasAnyRole(role, [ROLES.ADMIN, ROLES.EDITOR]) && (
                    <button className="btn btn-sm btn-warning me-1" onClick={() => openEditModal(p)}>Edit</button>
                  )}
                  {hasAnyRole(role, [ROLES.ADMIN]) && (
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)}>Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Program Entry Modal */}
      {modalOpen && (
        <div className="modal show fade d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    {priorComments.length > 0 ? `Add Update — ${formData.name}` : "Add Program Entry"}
                  </h5>
                  <button type="button" className="btn-close" onClick={closeModal} />
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Program Name</label>
                      <input type="text" name="name" className="form-control"
                        value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Date</label>
                      <input type="date" name="date" className="form-control"
                        value={formData.date} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">BU (Capability)</label>
                      <select name="capabilityId" className="form-control"
                        value={formData.capabilityId}
                        onChange={(e) => setFormData({ ...formData, capabilityId: e.target.value, franchiseId: "" })}>
                        <option value="">Select Capability</option>
                        {capabilities.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">SBU (Franchise)</label>
                      <select name="franchiseId" className="form-control"
                        value={formData.franchiseId} onChange={handleChange}>
                        <option value="">Select Franchise</option>
                        {filteredFormFranchises.map((f) => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">
                      New Comment / Update
                      {priorComments.length > 0 && (
                        <span className="text-muted fw-normal ms-2" style={{ fontSize: "12px" }}>
                          (previous comments shown below for reference)
                        </span>
                      )}
                    </label>
                    <textarea name="description" className="form-control" rows={3}
                      value={formData.description} onChange={handleChange}
                      placeholder="Add a new comment or update note for this entry..." />
                  </div>

                  {/* Prior comments — read-only reference */}
                  {priorComments.length > 0 && (
                    <div className="mb-3">
                      <div className="text-muted fw-semibold mb-2" style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                        Previous Comments
                      </div>
                      <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
                        {priorComments.map((entry, idx) => (
                          <div key={entry.id || idx} style={{
                            borderLeft: `3px solid ${idx === 0 ? "#4a148c" : "#dee2e6"}`,
                            paddingLeft: "12px",
                            opacity: idx === 0 ? 1 : 0.7,
                          }}>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: idx === 0 ? "#4a148c" : "#888", marginBottom: "2px" }}>
                              {entry.date || "No date"}
                              {idx === 0 && <span className="badge ms-2" style={{ background: "#4a148c", fontSize: "9px" }}>Latest</span>}
                            </div>
                            <div style={{ fontSize: "13px", color: "#444", whiteSpace: "pre-line" }}>
                              {entry.description || <em className="text-muted">No description</em>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-3 form-check">
                    <input type="checkbox" className="form-check-input" name="isActive"
                      id="isActiveCheck" checked={!!formData.isActive} onChange={handleChange} />
                    <label className="form-check-label" htmlFor="isActiveCheck">Active</label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="btn btn-success">Save Entry</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Program Detail Modal */}
      {detailProgram && (() => {
        const capName = capabilities.find((c) => c.id === detailProgram.capabilityId)?.name || "—";
        const frName  = franchises.find((f) => f.id === detailProgram.franchiseId)?.name  || "—";
        const members = users.filter(
          (u) => u.role?.toUpperCase() !== "ADMIN" &&
                 u.projectName?.toLowerCase().trim() === detailProgram.name.toLowerCase().trim()
        );
        return (
          <div className="modal show fade d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header" style={{ background: "linear-gradient(135deg, #4a148c, #6a1b9a)", color: "#fff" }}>
                  <h5 className="modal-title text-white fw-bold">{detailProgram.name}</h5>
                  <div className="ms-3">{getStatusBadge(detailProgram)}</div>
                  <button type="button" className="btn-close btn-close-white ms-auto" onClick={() => setDetailProgram(null)} />
                </div>
                <div className="modal-body px-4 py-4">
                  <div className="row g-3 mb-4">
                    {[
                      { label: "BU (Capability)", value: capName, icon: "🏢" },
                      { label: "SBU (Franchise)",  value: frName,  icon: "🔖" },
                      { label: "Date",             value: detailProgram.date || "—", icon: "📅" },
                      { label: "Team Size",        value: members.length, icon: "👥" },
                    ].map(({ label, value, icon }) => (
                      <div className="col-md-3" key={label}>
                        <div className="border rounded p-3 text-center bg-light h-100">
                          <div style={{ fontSize: "1.6rem" }}>{icon}</div>
                          <div className="text-muted small mt-1" style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.8px" }}>{label}</div>
                          <div className="fw-bold mt-1">{value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {detailProgram.description && (
                    <div className="mb-4">
                      <div className="text-muted fw-bold mb-2" style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}>Description</div>
                      <p className="border rounded p-3 bg-light mb-0" style={{ lineHeight: 1.75, whiteSpace: "pre-line" }}>
                        {detailProgram.description}
                      </p>
                    </div>
                  )}
                  <div className="text-muted fw-bold mb-2" style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}>
                    Team Members ({members.length})
                  </div>
                  {members.length === 0 ? (
                    <div className="text-muted fst-italic">No team members have this program assigned.</div>
                  ) : (
                    <div className="table-responsive" style={{ maxHeight: "300px", overflowY: "auto" }}>
                      <table className="table table-bordered table-sm table-hover align-middle mb-0">
                        <thead style={{ position: "sticky", top: 0, zIndex: 1, backgroundColor: "#f8f9fa" }}>
                          <tr>
                            <th>#</th><th>Name</th><th>Enterprise ID</th>
                            <th>Career Level</th><th>Location</th><th>Line Manager</th>
                          </tr>
                        </thead>
                        <tbody>
                          {members.map((m, i) => (
                            <tr key={m.id || i}>
                              <td>{i + 1}</td>
                              <td className="fw-semibold">{m.name}</td>
                              <td>{m.enterpriseId || "—"}</td>
                              <td>{m.careerLevel || "—"}</td>
                              <td>{m.location || "—"}</td>
                              <td>{m.lineManager || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setDetailProgram(null)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </Layout>
  );
}

export default AddProgram;
