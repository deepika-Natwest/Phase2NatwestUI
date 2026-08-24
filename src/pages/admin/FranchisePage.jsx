// frontend/src/pages/admin/FranchisePage.jsx
import React, { useEffect, useState } from "react";
import Layout from "../../components/admin/Layout";
import {
  getFranchises,
  getFranchiseCapabilities,
  createFranchise,
  updateFranchise,
  deleteFranchise,
} from "../../features/franchises/franchiseService";
import { getUserRole } from "../../utils/tokenUtils";
import { hasAnyRole } from "../../utils/roleUtils";
import { ROLES } from "../../constants/roles";

function FranchisePage() {
  const role = getUserRole();

  const [franchises, setFranchises] = useState([]);
  const [capabilities, setCapabilities] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentFranchise, setCurrentFranchise] = useState(null);
  const [name, setName] = useState("");
  const [selectedCapabilityId, setSelectedCapabilityId] = useState("");

  // Bulk delete state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({ capabilityId: "" });
  const [bulkEditing, setBulkEditing] = useState(false);

  const loadData = async () => {
    try {
      const fRes = await getFranchises();
      setFranchises(fRes.data);
      const cRes = await getFranchiseCapabilities();
      setCapabilities(cRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openModal = (franchise = null) => {
    setCurrentFranchise(franchise);
    setName(franchise ? franchise.name : "");
    setSelectedCapabilityId(franchise ? franchise.capabilityId : "");
    setModalOpen(true);
  };

  const closeModal = () => {
    setCurrentFranchise(null);
    setName("");
    setSelectedCapabilityId("");
    setModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !selectedCapabilityId) return alert("Select capability and enter franchise name");
    try {
      if (currentFranchise) {
        await updateFranchise(currentFranchise.id, { name, capabilityId: selectedCapabilityId });
      } else {
        await createFranchise({ name, capabilityId: selectedCapabilityId });
      }
      closeModal();
      loadData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Could not save franchise");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this franchise?")) return;
    try {
      await deleteFranchise(id);
      loadData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Could not delete franchise");
    }
  };

  // ── Bulk delete helpers ───────────────────────────
  const allSelected =
    franchises.length > 0 && franchises.every(f => selectedIds.has(f.id));
  const someSelected =
    franchises.some(f => selectedIds.has(f.id)) && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(franchises.map(f => f.id)));
    }
  };

  const toggleOne = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    setDeleting(true);
    try {
      await Promise.all([...selectedIds].map(id => deleteFranchise(id)));
      setSelectedIds(new Set());
      setConfirmDelete(false);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Could not delete some franchises");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkEdit = async () => {
    const changes = Object.fromEntries(
      Object.entries(bulkEditData).filter(([, v]) => v !== "")
    );
    if (!Object.keys(changes).length) { setBulkEditOpen(false); return; }
    setBulkEditing(true);
    try {
      await Promise.all(
        [...selectedIds].map(id => {
          const existing = franchises.find(f => f.id === id);
          return updateFranchise(id, { ...existing, ...changes });
        })
      );
      setSelectedIds(new Set());
      setBulkEditOpen(false);
      await loadData();
    } finally {
      setBulkEditing(false);
    }
  };

  const selectedCount = selectedIds.size;

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center titleBox">
        <h2>Franchise Manager</h2>
      </div>

      <div className="searchHeadBox p-3">
        <div className="row align-items-center">
          <div className="col-4" />

          {/* Bulk delete action */}
          <div className="col-4 text-center">
            {hasAnyRole(role, [ROLES.ADMIN]) && selectedCount > 0 && !confirmDelete && (
              <div className="d-inline-flex gap-2">
                <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
                  Delete Selected ({selectedCount})
                </button>
                {hasAnyRole(role, [ROLES.ADMIN, ROLES.EDITOR]) && (
                  <button className="btn btn-info" onClick={() => { setBulkEditData({ capabilityId: "" }); setBulkEditOpen(true); }}>
                    Edit Selected ({selectedCount})
                  </button>
                )}
              </div>
            )}
            {confirmDelete && (
              <div className="d-inline-flex align-items-center gap-2
                              border border-danger rounded px-3 py-1"
                   style={{ background: "#fff5f5" }}>
                <span className="text-danger fw-semibold" style={{ fontSize: "14px" }}>
                  Delete {selectedCount} item{selectedCount !== 1 ? "s" : ""}?
                </span>
                <button className="btn btn-danger btn-sm" onClick={handleBulkDelete} disabled={deleting}>
                  {deleting ? "Deleting…" : "Confirm"}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="col-4 text-end">
            {hasAnyRole(role, [ROLES.ADMIN]) && (
              <button className="btn btn-primary" onClick={() => openModal()}>
                Add Franchise
              </button>
            )}
          </div>
        </div>
      </div>

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
              <th>Franchise Name</th>
              <th>Capability</th>
              <th width="150">Actions</th>
            </tr>
          </thead>
          <tbody>
            {franchises.map((f) => (
              <tr key={f.id} style={selectedIds.has(f.id) ? { background: "#fff1f1" } : undefined}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(f.id)}
                    onChange={() => toggleOne(f.id)}
                  />
                </td>
                <td>{f.name}</td>
                <td>{capabilities.find((c) => c.id === f.capabilityId)?.name || "—"}</td>
                <td>
                  {hasAnyRole(role, [ROLES.ADMIN, ROLES.EDITOR]) && (
                    <button className="btn btn-sm btn-warning me-2" onClick={() => openModal(f)}>
                      Edit
                    </button>
                  )}
                  {hasAnyRole(role, [ROLES.ADMIN]) && (
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(f.id)}>
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {franchises.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center text-muted py-4">No franchises found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal show fade d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">{currentFranchise ? "Edit Franchise" : "Add Franchise"}</h5>
                  <button type="button" className="btn-close" onClick={closeModal} />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Select Capability</label>
                    <select
                      className="form-select"
                      value={selectedCapabilityId}
                      onChange={(e) => setSelectedCapabilityId(e.target.value)}
                      required
                    >
                      <option value="">Select Capability</option>
                      {capabilities.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Franchise Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="btn btn-success">Save</button>
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
                <h5 className="modal-title">Bulk Edit — {selectedCount} franchise{selectedCount !== 1 ? "s" : ""}</h5>
                <button type="button" className="btn-close" onClick={() => setBulkEditOpen(false)} />
              </div>
              <div className="modal-body">
                <p className="text-muted small mb-3">Leave a field blank to keep existing values unchanged.</p>
                <div className="mb-3">
                  <label className="form-label">Reassign Capability (BU)</label>
                  <select
                    className="form-select"
                    value={bulkEditData.capabilityId}
                    onChange={e => setBulkEditData(prev => ({ ...prev, capabilityId: e.target.value }))}
                  >
                    <option value="">— keep existing —</option>
                    {capabilities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setBulkEditOpen(false)} disabled={bulkEditing}>Cancel</button>
                <button className="btn btn-primary" onClick={handleBulkEdit} disabled={bulkEditing}>
                  {bulkEditing ? "Saving…" : `Apply to ${selectedCount} franchise${selectedCount !== 1 ? "s" : ""}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default FranchisePage;
