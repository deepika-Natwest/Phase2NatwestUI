import React, { useEffect, useState } from "react";
import Layout from "../../components/admin/Layout";
import {
  getPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
} from "../../features/program/programService";
import api from "../../services/api";
import { getUserRole } from "../../utils/tokenUtils";
import { hasAnyRole } from "../../utils/roleUtils";
import { ROLES } from "../../constants/roles";

// A program is effectively active only if isActive is not false
// AND at least one of capability or franchise is configured.
const isEffectivelyActive = (p) => {
  if (p.isActive === false) return false;
  if (!p.capabilityId && !p.franchiseId) return false;
  return true;
};

const getStatusBadge = (p) => {
  if (p.isActive === false) {
    return <span className="badge bg-danger">Inactive</span>;
  }
  if (!p.capabilityId && !p.franchiseId) {
    return (
      <span className="badge bg-warning text-dark" title="No BU/SBU assigned — auto-marked inactive">
        Auto-Inactive
      </span>
    );
  }
  return <span className="badge bg-success">Active</span>;
};

function AdminProgramPage() {
  const role = getUserRole();

  const [programs, setPrograms] = useState([]);
  const [capabilities, setCapabilities] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [users, setUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentProgram, setCurrentProgram] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({ capabilityId: "", franchiseId: "", isActive: "" });
  const [bulkEditing, setBulkEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    capabilityId: "",
    franchiseId: "",
    description: "",
    date: "",
    isActive: true,
  });

  const filteredFranchises = franchises.filter(
    (f) => !formData.capabilityId || f.capabilityId === formData.capabilityId
  );

  // Programs from Teams tab not yet configured in admin
  const managedNames = new Set(programs.map((p) => p.name.toLowerCase().trim()));
  const unmanagedPrograms = [
    ...new Set(
      users
        .filter((u) => u.role?.toUpperCase() !== "ADMIN" && u.projectName)
        .map((u) => u.projectName)
    ),
  ].filter((name) => !managedNames.has(name.toLowerCase().trim()));

  const loadData = async () => {
    try {
      const [progRes, capRes, frRes, usersRes] = await Promise.all([
        getPrograms(),
        api.get("/capabilities"),
        api.get("/franchises"),
        api.get("/users"),
      ]);
      setPrograms(Array.isArray(progRes.data) ? progRes.data : []);
      setCapabilities(Array.isArray(capRes.data) ? capRes.data : []);
      setFranchises(Array.isArray(frRes.data) ? frRes.data : []);
      const userData = usersRes.data?.users || usersRes.data?.data || usersRes.data || [];
      setUsers(Array.isArray(userData) ? userData : []);
    } catch (err) {
      console.error("Failed to load program data:", err);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openModal = (program = null) => {
    setCurrentProgram(program);
    setFormData(
      program
        ? {
            name:         program.name         || "",
            capabilityId: program.capabilityId  || "",
            franchiseId:  program.franchiseId   || "",
            description:  program.description   || "",
            date:         program.date          || "",
            isActive:     program.isActive !== false, // default true if not set
          }
        : {
            name: "", capabilityId: "", franchiseId: "",
            description: "", date: new Date().toISOString().split("T")[0],
            isActive: true,
          }
    );
    setModalOpen(true);
  };

  const configureProgram = (name) => {
    setCurrentProgram(null);
    setFormData({
      name, capabilityId: "", franchiseId: "",
      description: "", date: new Date().toISOString().split("T")[0],
      isActive: true,
    });
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setCurrentProgram(null); };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "capabilityId" ? { franchiseId: "" } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentProgram) {
        await updateProgram(currentProgram.id, formData);
      } else {
        await createProgram(formData);
      }
      closeModal();
      loadData();
    } catch (err) {
      console.error("Failed to save program:", err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this program?")) {
      try {
        await deleteProgram(id);
        loadData();
      } catch (err) {
        console.error("Failed to delete program:", err);
      }
    }
  };

  // Quick-toggle active/inactive without opening modal
  const handleToggleActive = async (p) => {
    try {
      await updateProgram(p.id, { ...p, isActive: !isEffectivelyActive(p) });
      loadData();
    } catch (err) {
      console.error("Failed to toggle active status:", err);
    }
  };

  const capName = (id) => capabilities.find((c) => c.id === id)?.name || "-";
  const frName  = (id) => franchises.find((f) => f.id === id)?.name || "-";

  const allSelected = programs.length > 0 && programs.every(p => selectedIds.has(p.id));
  const someSelected = programs.some(p => selectedIds.has(p.id)) && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(programs.map(p => p.id)));
  };

  const toggleOne = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectedCount = selectedIds.size;

  const handleBulkEdit = async () => {
    const rawChanges = { ...bulkEditData };
    if (rawChanges.isActive === "") delete rawChanges.isActive;
    else rawChanges.isActive = rawChanges.isActive === "true";
    const changes = Object.fromEntries(
      Object.entries(rawChanges).filter(([, v]) => v !== "")
    );
    if (!Object.keys(changes).length) { setBulkEditOpen(false); return; }
    setBulkEditing(true);
    try {
      await Promise.all(
        [...selectedIds].map(id => {
          const existing = programs.find(p => p.id === id);
          return updateProgram(id, { ...existing, ...changes });
        })
      );
      setSelectedIds(new Set());
      setBulkEditOpen(false);
      loadData();
    } finally {
      setBulkEditing(false);
    }
  };

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center titleBox">
        <h2>Program Manager</h2>
        {hasAnyRole(role, [ROLES.ADMIN, ROLES.EDITOR]) && (
          <button className="btn btn-primary" onClick={() => openModal()}>
            Add Program
          </button>
        )}
      </div>

      {selectedCount > 0 && (
        <div className="searchHeadBox p-3">
          <div className="d-flex justify-content-center gap-2">
            {hasAnyRole(role, [ROLES.ADMIN, ROLES.EDITOR]) && (
              <button className="btn btn-info" onClick={() => { setBulkEditData({ capabilityId: "", franchiseId: "", isActive: "" }); setBulkEditOpen(true); }}>
                Edit Selected ({selectedCount})
              </button>
            )}
          </div>
        </div>
      )}

      <div className="adminContent p-4">
        <table className="table table-bordered table-striped">
          <thead>
            <tr>
              <th style={{ width: "42px" }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={el => { if (el) el.indeterminate = someSelected; }}
                  onChange={toggleSelectAll}
                  title={allSelected ? "Deselect all" : "Select all"}
                />
              </th>
              <th>#</th>
              <th>Program / Project Name</th>
              <th>BU (Capability)</th>
              <th>SBU (Franchise)</th>
              <th>Date</th>
              <th>Active</th>
              <th>Status</th>
              <th width="160">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Admin-configured programs */}
            {programs.map((p, index) => (
              <tr key={p.id} style={selectedIds.has(p.id) ? { background: "#fff1f1" } : undefined}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(p.id)}
                    onChange={() => toggleOne(p.id)}
                  />
                </td>
                <td>{index + 1}</td>
                <td className="fw-semibold">{p.name}</td>
                <td>{capName(p.capabilityId)}</td>
                <td>{frName(p.franchiseId)}</td>
                <td>
                  {p.date
                    ? new Date(p.date).toLocaleDateString("en-IN", {
                        day: "2-digit", month: "short", year: "numeric",
                      })
                    : "-"}
                </td>

                {/* Quick-toggle checkbox */}
                <td className="text-center">
                  {hasAnyRole(role, [ROLES.ADMIN]) ? (
                    <input
                      type="checkbox"
                      checked={isEffectivelyActive(p)}
                      onChange={() => handleToggleActive(p)}
                      title={
                        !p.capabilityId && !p.franchiseId
                          ? "Auto-inactive: assign a BU/SBU to activate"
                          : isEffectivelyActive(p)
                          ? "Click to mark inactive"
                          : "Click to mark active"
                      }
                      disabled={!p.capabilityId && !p.franchiseId && p.isActive !== false}
                    />
                  ) : (
                    <span>{isEffectivelyActive(p) ? "✓" : "✗"}</span>
                  )}
                </td>

                <td>{getStatusBadge(p)}</td>

                <td>
                  {hasAnyRole(role, [ROLES.ADMIN, ROLES.EDITOR]) && (
                    <button
                      className="btn btn-sm btn-warning me-2"
                      onClick={() => openModal(p)}
                    >
                      Edit
                    </button>
                  )}
                  {hasAnyRole(role, [ROLES.ADMIN]) && (
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(p.id)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {/* Programs from Teams tab not yet configured */}
            {unmanagedPrograms.map((name, index) => (
              <tr key={`unmanaged-${name}`} className="table-light">
                <td></td>
                <td>{programs.length + index + 1}</td>
                <td className="text-muted">{name}</td>
                <td className="text-muted">-</td>
                <td className="text-muted">-</td>
                <td className="text-muted">-</td>
                <td className="text-center text-muted">-</td>
                <td>
                  <span className="badge bg-warning text-dark">From Teams</span>
                </td>
                <td>
                  {hasAnyRole(role, [ROLES.ADMIN, ROLES.EDITOR]) && (
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => configureProgram(name)}
                    >
                      Configure
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {programs.length === 0 && unmanagedPrograms.length === 0 && (
              <tr>
                <td colSpan="9" className="text-center py-4 text-muted">
                  No programs found. Click "Add Program" to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div
          className="modal show fade d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    {currentProgram ? "Edit Program" : "Add Program"}
                  </h5>
                  <button type="button" className="btn-close" onClick={closeModal} />
                </div>

                <div className="modal-body row">
                  <div className="col-md-6 mb-3">
                    <label>Program / Project Name</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label>Date</label>
                    <input
                      type="date"
                      name="date"
                      className="form-control"
                      value={formData.date}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label>BU (Capability)</label>
                    <select
                      name="capabilityId"
                      className="form-control"
                      value={formData.capabilityId}
                      onChange={handleChange}
                    >
                      <option value="">Select BU</option>
                      {capabilities.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label>SBU (Franchise)</label>
                    <select
                      name="franchiseId"
                      className="form-control"
                      value={formData.franchiseId}
                      onChange={handleChange}
                      disabled={!formData.capabilityId}
                    >
                      <option value="">Select SBU</option>
                      {filteredFranchises.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                    {!formData.capabilityId && (
                      <small className="text-muted">Select a BU first to filter SBUs</small>
                    )}
                  </div>

                  <div className="col-12 mb-3">
                    <label>Description</label>
                    <textarea
                      name="description"
                      className="form-control"
                      rows="4"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Enter program/project description..."
                    />
                  </div>

                  {/* Active/Inactive toggle */}
                  <div className="col-12 mb-2">
                    <div className="form-check form-switch">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        role="switch"
                        id="isActiveSwitch"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="isActiveSwitch">
                        <strong>Mark as Active</strong>
                      </label>
                    </div>
                    {!formData.capabilityId && !formData.franchiseId && formData.isActive && (
                      <small className="text-warning d-block mt-1">
                        ⚠ This program will be auto-marked inactive until a BU or SBU is assigned.
                      </small>
                    )}
                    {!formData.isActive && (
                      <small className="text-danger d-block mt-1">
                        This program is manually marked inactive and will not appear in active listings.
                      </small>
                    )}
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success">
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {bulkEditOpen && (
        <div className="modal show fade d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Bulk Edit — {selectedCount} program{selectedCount !== 1 ? "s" : ""}</h5>
                <button type="button" className="btn-close" onClick={() => setBulkEditOpen(false)} />
              </div>
              <div className="modal-body">
                <p className="text-muted small mb-3">Leave a field blank to keep existing values unchanged.</p>
                <div className="mb-3">
                  <label className="form-label">BU (Capability)</label>
                  <select className="form-select" value={bulkEditData.capabilityId}
                    onChange={e => setBulkEditData(prev => ({ ...prev, capabilityId: e.target.value, franchiseId: "" }))}>
                    <option value="">— keep existing —</option>
                    {capabilities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">SBU (Franchise)</label>
                  <select className="form-select" value={bulkEditData.franchiseId}
                    onChange={e => setBulkEditData(prev => ({ ...prev, franchiseId: e.target.value }))}>
                    <option value="">— keep existing —</option>
                    {franchises.filter(f => !bulkEditData.capabilityId || f.capabilityId === bulkEditData.capabilityId)
                      .map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Active Status</label>
                  <select className="form-select" value={bulkEditData.isActive}
                    onChange={e => setBulkEditData(prev => ({ ...prev, isActive: e.target.value }))}>
                    <option value="">— keep existing —</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setBulkEditOpen(false)} disabled={bulkEditing}>Cancel</button>
                <button className="btn btn-primary" onClick={handleBulkEdit} disabled={bulkEditing}>
                  {bulkEditing ? "Saving…" : `Apply to ${selectedCount} program${selectedCount !== 1 ? "s" : ""}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default AdminProgramPage;
