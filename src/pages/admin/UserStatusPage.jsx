import React, { useEffect, useState } from "react";
import Layout from "../../components/admin/Layout";
import {
  getUserStatuses,
  createUserStatus,
  updateUserStatus,
  deleteUserStatus,
} from "../../features/userStatus/userStatusService";
import { getUserRole } from "../../utils/tokenUtils";
import { hasAnyRole } from "../../utils/roleUtils";
import { ROLES } from "../../constants/roles";

function UserStatusPage() {
  const role = getUserRole();

  const [statuses, setStatuses] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(null);
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
    const res = await getUserStatuses();
    setStatuses(res.data);
  };

  useEffect(() => { loadData(); }, []);

  const openModal = () => {
    setCurrentStatus(null);
    setName("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentStatus(null);
    setName("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createUserStatus({ name });
    closeModal();
    loadData();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this user status?")) {
      await deleteUserStatus(id);
      loadData();
    }
  };

  // ── Bulk delete helpers ───────────────────────────
  const allSelected =
    statuses.length > 0 && statuses.every(s => selectedIds.has(s.id));
  const someSelected =
    statuses.some(s => selectedIds.has(s.id)) && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(statuses.map(s => s.id)));
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
      await Promise.all([...selectedIds].map(id => deleteUserStatus(id)));
      setSelectedIds(new Set());
      setConfirmDelete(false);
      await loadData();
    } finally {
      setDeleting(false);
    }
  };

  const startEdit = (s) => {
    setEditingIds(prev => new Set([...prev, s.id]));
    setEditValues(prev => ({ ...prev, [s.id]: s.name }));
  };

  const cancelEdit = (id) => {
    setEditingIds(prev => { const ns = new Set(prev); ns.delete(id); return ns; });
    setEditValues(prev => { const o = { ...prev }; delete o[id]; return o; });
  };

  const saveInlineEdit = async (id) => {
    const newName = (editValues[id] || "").trim();
    if (!newName) return;
    setSaving(prev => new Set([...prev, id]));
    try {
      await updateUserStatus(id, { name: newName });
      cancelEdit(id);
      loadData();
    } finally {
      setSaving(prev => { const ns = new Set(prev); ns.delete(id); return ns; });
    }
  };

  const selectedCount = selectedIds.size;

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center titleBox">
        <h2>User Status Manager</h2>
      </div>

      <div className="searchHeadBox p-3">
        <div className="row align-items-center">
          {/* Bulk delete action */}
          <div className="col-4">
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
                  Delete {selectedCount} status{selectedCount !== 1 ? "es" : ""}?
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

          <div className="col-4" />

          <div className="col-4 text-end">
            {hasAnyRole(role, [ROLES.ADMIN]) && (
              <button className="btn btn-primary" onClick={() => openModal()}>
                Add Status
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
              <th>Resource Type / Status Name</th>
              <th width="150">Actions</th>
            </tr>
          </thead>
          <tbody>
            {statuses.map((s) => (
              <tr key={s.id} style={selectedIds.has(s.id) ? { background: "#fff1f1" } : undefined}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(s.id)}
                    onChange={() => toggleOne(s.id)}
                    disabled={editingIds.has(s.id)}
                  />
                </td>
                <td>
                  {editingIds.has(s.id) ? (
                    <input
                      className="form-control form-control-sm"
                      value={editValues[s.id] || ""}
                      onChange={e => setEditValues(prev => ({ ...prev, [s.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === "Enter") saveInlineEdit(s.id); if (e.key === "Escape") cancelEdit(s.id); }}
                      autoFocus
                    />
                  ) : s.name}
                </td>
                <td>
                  {editingIds.has(s.id) ? (
                    <>
                      <button
                        className="btn btn-sm btn-success me-1"
                        onClick={() => saveInlineEdit(s.id)}
                        disabled={saving.has(s.id)}
                      >
                        {saving.has(s.id) ? "…" : "Save"}
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => cancelEdit(s.id)}
                        disabled={saving.has(s.id)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      {hasAnyRole(role, [ROLES.ADMIN, ROLES.EDITOR]) && (
                        <button className="btn btn-sm btn-warning me-2" onClick={() => startEdit(s)}>
                          Edit
                        </button>
                      )}
                      {hasAnyRole(role, [ROLES.ADMIN]) && (
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s.id)}>
                          Delete
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
            {statuses.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center text-muted py-4">
                  No user statuses found. Click "Add Status" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal show fade d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    Add User Status
                  </h5>
                  <button type="button" className="btn-close" onClick={closeModal} />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Resource Type / Status Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Permanent, Contractor, On-site, Remote…"
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

export default UserStatusPage;
