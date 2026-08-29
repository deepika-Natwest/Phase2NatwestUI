import React, { useEffect, useRef, useState } from "react";
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
  const [name, setName] = useState("");

  // Inline editing
  const [editingIds, setEditingIds] = useState(new Set());
  const [editValues, setEditValues] = useState({});
  const [saving, setSaving] = useState(new Set());

  // Bulk delete
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Load list
  const loadData = async () => {
    const res = await getCapabilities();
    const sorted = [...(res.data || [])].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );
    setCapabilities(sorted);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Inline edit helpers
  const startEdit = (cap) => {
    setEditingIds(prev => new Set([...prev, cap.id]));
    setEditValues(prev => ({ ...prev, [cap.id]: cap.name }));
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
      await updateCapability(id, { name: newName });
      cancelEdit(id);
      loadData();
    } finally {
      setSaving(prev => { const ns = new Set(prev); ns.delete(id); return ns; });
    }
  };

  // Bulk select helpers
  const selectedCount = selectedIds.size;
  const allSelected = capabilities.length > 0 && capabilities.every(c => selectedIds.has(c.id));
  const someSelected = !allSelected && capabilities.some(c => selectedIds.has(c.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(capabilities.map(c => c.id)));
    }
  };

  const toggleOne = (id) => {
    setSelectedIds(prev => {
      const ns = new Set(prev);
      if (ns.has(id)) ns.delete(id); else ns.add(id);
      return ns;
    });
  };

  // Indeterminate ref for select-all checkbox
  const selectAllRef = useRef(null);
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  const handleBulkDelete = async () => {
    try {
      await Promise.all([...selectedIds].map(id => deleteCapability(id)));
      setSelectedIds(new Set());
      setConfirmDelete(false);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Could not delete selected capabilities");
    }
  };

  // Modal (Add only)
  const openModal = () => {
    setName("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
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

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center titleBox">
        <h2>Capability Manager</h2>
      </div>
      <div className="searchHeadBox p-3">
        <div className="row align-items-center">
          <div className="col-4">
            {selectedCount > 0 && !confirmDelete && (
              <button
                className="btn btn-danger"
                onClick={() => setConfirmDelete(true)}
              >
                Delete Selected ({selectedCount})
              </button>
            )}
            {confirmDelete && (
              <span className="d-flex align-items-center gap-2">
                <span>Delete {selectedCount} item(s)?</span>
                <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>Yes, Delete</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setConfirmDelete(false)}>Cancel</button>
              </span>
            )}
          </div>
          <div className="col-4"></div>
          <div className="col-4 text-end">
            {hasAnyRole(role, [ROLES.ADMIN]) && (
              <button className="btn btn-primary" onClick={() => openModal()}>Add Capability</button>
            )}
          </div>
        </div>
      </div>

      <div className="adminContent p-4">
        <table className="table table-bordered table-striped">
          <thead>
            <tr>
              {hasAnyRole(role, [ROLES.ADMIN]) && (
                <th width="40">
                  <input
                    type="checkbox"
                    ref={selectAllRef}
                    checked={allSelected}
                    onChange={toggleSelectAll}
                  />
                </th>
              )}
              <th>Name</th>
              <th width="180">Actions</th>
            </tr>
          </thead>
          <tbody>
            {capabilities.map((cap) => (
              <tr key={cap.id}>
                {hasAnyRole(role, [ROLES.ADMIN]) && (
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(cap.id)}
                      onChange={() => toggleOne(cap.id)}
                    />
                  </td>
                )}
                <td>
                  {editingIds.has(cap.id) ? (
                    <input
                      className="form-control form-control-sm"
                      value={editValues[cap.id] ?? ""}
                      onChange={(e) =>
                        setEditValues(prev => ({ ...prev, [cap.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveInlineEdit(cap.id);
                        if (e.key === "Escape") cancelEdit(cap.id);
                      }}
                      autoFocus
                    />
                  ) : (
                    cap.name
                  )}
                </td>
                <td>
                  {editingIds.has(cap.id) ? (
                    <>
                      <button
                        className="btn btn-sm btn-success me-2"
                        onClick={() => saveInlineEdit(cap.id)}
                        disabled={saving.has(cap.id)}
                      >
                        {saving.has(cap.id) ? "Saving…" : "Save"}
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
                        <button
                          className="btn btn-sm btn-warning me-2"
                          onClick={() => startEdit(cap)}
                        >
                          Edit
                        </button>
                      )}
                      {hasAnyRole(role, [ROLES.ADMIN]) && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(cap.id)}
                        >
                          Delete
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Capability Modal */}
      {modalOpen && (
        <div className="modal show fade d-block" tabIndex="-1" aria-labelledby="addCapModalLabel" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title" id="addCapModalLabel">Add Capability</h5>
                  <button type="button" className="btn-close" onClick={closeModal}></button>
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
    </Layout>
  );
}

export default CapabilitiesPage;
