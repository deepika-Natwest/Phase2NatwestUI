import React, { useEffect, useState } from "react";
import Layout from "../../components/admin/Layout";
import {
  getCapabilities,
  createCapability,
  updateCapability,
  deleteCapability,
} from "../../features/capabilities/capabilityService";
import { getUserRole } from "../../utils/tokenUtils";
import { hasAnyRole } from "../../utils/roleUtils";
import { ROLES } from "../../constants/roles";

function CapabilitiesPage() {
  const role = getUserRole();

  const [capabilities, setCapabilities] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentCapability, setCurrentCapability] = useState(null);
  const [name, setName] = useState("");

  // Bulk delete state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Inline edit state
  const [editingIds, setEditingIds] = useState(new Set());
  const [editValues, setEditValues] = useState({});
  const [saving, setSaving] = useState(new Set());

  const loadData = async () => {
    const res = await getCapabilities();
    setCapabilities(res.data);
  };

  useEffect(() => { loadData(); }, []);

  const openModal = () => {
    setCurrentCapability(null);
    setName("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentCapability(null);
    setName("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createCapability({ name });
    closeModal();
    loadData();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this capability?")) {
      await deleteCapability(id);
      loadData();
    }
  };

  // ── Bulk delete helpers ───────────────────────────
  const allSelected =
    capabilities.length > 0 && capabilities.every(c => selectedIds.has(c.id));
  const someSelected =
    capabilities.some(c => selectedIds.has(c.id)) && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(capabilities.map(c => c.id)));
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
      await Promise.all([...selectedIds].map(id => deleteCapability(id)));
      setSelectedIds(new Set());
      setConfirmDelete(false);
      await loadData();
    } finally {
      setDeleting(false);
    }
  };

  const startEdit = (cap) => {
    setEditingIds(prev => new Set([...prev, cap.id]));
    setEditValues(prev => ({ ...prev, [cap.id]: cap.name }));
  };

  const cancelEdit = (id) => {
    setEditingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    setEditValues(prev => { const o = { ...prev }; delete o[id]; return o; });
  };

  const saveInlineEdit = async (id) => {
    const newName = (editValues[id] || "").trim();
    if (!newName) return;
    setSaving(prev => new Set([...prev, id]));
    try {
      await updateCapability(id, { name: newName });
      cancelEdit(id);
      loadData();
    } finally {
      setSaving(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  const selectedCount = selectedIds.size;

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center titleBox">
        <h2>Capability Manager</h2>
      </div>

      <div className="searchHeadBox p-3">
        <div className="row align-items-center">
          <div className="col-4" />

          {/* Bulk delete action */}
          <div className="col-4 text-center">
            {hasAnyRole(role, [ROLES.ADMIN]) && selectedCount > 0 && !confirmDelete && (
              <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
                Delete Selected ({selectedCount})
              </button>
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
                Add Capability
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
              <th>Name</th>
              <th width="150">Actions</th>
            </tr>
          </thead>
          <tbody>
            {capabilities.map((cap) => (
              <tr key={cap.id} style={selectedIds.has(cap.id) ? { background: "#fff1f1" } : undefined}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(cap.id)}
                    onChange={() => toggleOne(cap.id)}
                    disabled={editingIds.has(cap.id)}
                  />
                </td>
                <td>
                  {editingIds.has(cap.id) ? (
                    <input
                      className="form-control form-control-sm"
                      value={editValues[cap.id] || ""}
                      onChange={e => setEditValues(prev => ({ ...prev, [cap.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === "Enter") saveInlineEdit(cap.id); if (e.key === "Escape") cancelEdit(cap.id); }}
                      autoFocus
                    />
                  ) : cap.name}
                </td>
                <td>
                  {editingIds.has(cap.id) ? (
                    <>
                      <button
                        className="btn btn-sm btn-success me-1"
                        onClick={() => saveInlineEdit(cap.id)}
                        disabled={saving.has(cap.id)}
                      >
                        {saving.has(cap.id) ? "…" : "Save"}
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => cancelEdit(cap.id)}
                        disabled={saving.has(cap.id)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      {hasAnyRole(role, [ROLES.ADMIN, ROLES.EDITOR]) && (
                        <button className="btn btn-sm btn-warning me-2" onClick={() => startEdit(cap)}>
                          Edit
                        </button>
                      )}
                      {hasAnyRole(role, [ROLES.ADMIN]) && (
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(cap.id)}>
                          Delete
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
            {capabilities.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center text-muted py-4">No capabilities found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal show fade d-block" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    Add Capability
                  </h5>
                  <button type="button" className="btn-close" onClick={closeModal} />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Capability Name</label>
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
    </Layout>
  );
}

export default CapabilitiesPage;
