import React, { useEffect, useState } from "react";
import api from "../../services/api";
import UserForm from "../../features/users/UserForm";
import Layout from "../../components/admin/Layout";
import { LOCATION_OPTIONS } from "../../utils/userConfig";

const UserPage = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);

  // Bulk delete state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Bulk edit state
  const [capabilities, setCapabilities] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [userStatuses, setUserStatuses] = useState([]);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({
    capabilityId: "", franchiseId: "", careerLevel: "", location: "", status: "", resourceType: ""
  });
  const [bulkEditing, setBulkEditing] = useState(false);

  const fetchUsers = async () => {
    const res = await api.get("/users");
    setUsers(res.data);
  };

  useEffect(() => {
    fetchUsers();
    api.get("/capabilities").then(res => setCapabilities(res.data)).catch(() => {});
    api.get("/franchises").then(res => setFranchises(res.data)).catch(() => {});
    api.get("/user-statuses").then(res => setUserStatuses(res.data)).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setSelectedIds(new Set());
  };

  const getFranchiseName = (id) => {
    const f = franchises.find(f => f.id === id);
    return f ? f.name : "";
  };

  const filteredUsers = users.filter(u =>
    (u.name || "").toLowerCase().includes(search.toLowerCase())
  );

  // ── Checkbox helpers ──────────────────────────────
  // Admin users are never selectable or deletable
  const isAdmin = (u) => u.role?.toUpperCase() === "ADMIN";
  const careerLevels = Array.from({ length: 12 }, (_, i) => `Level ${i + 1}`);
  const statuses = ["Active", "Inactive"];
  const selectableUsers = filteredUsers.filter(u => !isAdmin(u));

  const allSelected =
    selectableUsers.length > 0 && selectableUsers.every(u => selectedIds.has(u.id));

  const someSelected =
    selectableUsers.some(u => selectedIds.has(u.id)) && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableUsers.map(u => u.id)));
    }
  };

  const toggleOne = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Bulk delete ───────────────────────────────────
  const handleBulkDelete = async () => {
    setDeleting(true);
    try {
      // Safety net: never delete admin users even if somehow selected
      const deletableIds = [...selectedIds].filter(id => {
        const u = users.find(u => u.id === id);
        return u && !isAdmin(u);
      });
      await Promise.all(deletableIds.map(id => api.delete(`/users/${id}`)));
      setSelectedIds(new Set());
      setConfirmDelete(false);
      await fetchUsers();
    } finally {
      setDeleting(false);
    }
  };

  // ── Single delete (with confirm) ─────────────────
  const handleSingleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    await api.delete(`/users/${id}`);
    fetchUsers();
  };

  // ── Bulk edit ─────────────────────────────────────
  const handleBulkEdit = async () => {
    const changes = Object.fromEntries(
      Object.entries(bulkEditData).filter(([, v]) => v !== "")
    );
    if (!Object.keys(changes).length) { setBulkEditOpen(false); return; }
    setBulkEditing(true);
    try {
      await Promise.all(
        [...selectedIds].filter(id => {
          const u = users.find(u => u.id === id);
          return u && !isAdmin(u);
        }).map(id => api.put(`/users/${id}`, changes))
      );
      setSelectedIds(new Set());
      setBulkEditOpen(false);
      await fetchUsers();
    } finally {
      setBulkEditing(false);
    }
  };

  const selectedCount = selectedIds.size;

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center titleBox">
        <h2>Users Manager</h2>
      </div>

      <div className="searchHeadBox p-3">
        <div className="row align-items-center">
          {/* Search */}
          <div className="col-4">
            <input
              type="text"
              className="form-control"
              placeholder="Search by name"
              value={search}
              onChange={handleSearch}
            />
          </div>

          {/* Bulk-delete action bar */}
          <div className="col-4 text-center">
            {selectedCount > 0 && !confirmDelete && (
              <div className="d-inline-flex gap-2">
                <button
                  className="btn btn-danger"
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete Selected ({selectedCount})
                </button>
                <button
                  className="btn btn-info"
                  onClick={() => {
                    setBulkEditData({ capabilityId: "", franchiseId: "", careerLevel: "", location: "", status: "", resourceType: "" });
                    setBulkEditOpen(true);
                  }}
                >
                  Edit Selected ({selectedCount})
                </button>
              </div>
            )}

            {confirmDelete && (
              <div className="d-inline-flex align-items-center gap-2
                              border border-danger rounded px-3 py-1"
                   style={{ background: "#fff5f5" }}>
                <span className="text-danger fw-semibold" style={{ fontSize: "14px" }}>
                  Delete {selectedCount} user{selectedCount !== 1 ? "s" : ""}?
                </span>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleBulkDelete}
                  disabled={deleting}
                >
                  {deleting ? "Deleting…" : "Confirm"}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Add User */}
          <div className="col-4 text-end">
            <button
              className="btn btn-success"
              onClick={() => { setEditUser(null); setShowModal(true); }}
            >
              Add User
            </button>
          </div>
        </div>
      </div>

      <div className="container mt-4">
        <table className="table table-bordered">
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
              <th>Enterprise ID</th>
              <th>Role</th>
              <th>Franchise</th>
              <th>Status</th>
              <th>Resource Type</th>
              <th>NatWest DOJ</th>
              <th>SOW ID</th>
              <th>SOW Start</th>
              <th>SOW End</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => (
              <tr
                key={u.id}
                style={selectedIds.has(u.id)
                  ? { background: "#fff1f1" }
                  : undefined}
              >
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(u.id)}
                    onChange={() => toggleOne(u.id)}
                    disabled={isAdmin(u)}
                    title={isAdmin(u) ? "Admin user cannot be deleted" : undefined}
                  />
                </td>
                <td>{u.name}</td>
                <td>{u.enterpriseId}</td>
                <td>{u.role}</td>
                <td>{getFranchiseName(u.franchiseId)}</td>
                <td>{u.status}</td>
                <td>{u.resourceType || "-"}</td>
                <td>{u.natwestDoj || "-"}</td>
                <td>{u.sowId || "-"}</td>
                <td>{u.sowStartDate || "-"}</td>
                <td>{u.sowEndDate || "-"}</td>
                <td>
                  <button
                    className="btn btn-primary btn-sm me-1"
                    onClick={() => { setEditUser(u); setShowModal(true); }}
                  >
                    Edit
                  </button>
                  {!isAdmin(u) && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleSingleDelete(u.id)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan="12" className="text-center text-muted py-4">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {showModal && (
          <UserForm
            onClose={() => { setShowModal(false); fetchUsers(); }}
            user={editUser}
          />
        )}
      </div>
      {bulkEditOpen && (
        <div className="modal show fade d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Bulk Edit — {selectedCount} user{selectedCount !== 1 ? "s" : ""}</h5>
                <button type="button" className="btn-close" onClick={() => setBulkEditOpen(false)} />
              </div>
              <div className="modal-body">
                <p className="text-muted small mb-3">Leave a field blank to keep existing values unchanged. Admin users are never modified.</p>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Capability (BU)</label>
                    <select className="form-select" value={bulkEditData.capabilityId}
                      onChange={e => setBulkEditData(prev => ({ ...prev, capabilityId: e.target.value, franchiseId: "" }))}>
                      <option value="">— keep existing —</option>
                      {capabilities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Franchise (SBU)</label>
                    <select className="form-select" value={bulkEditData.franchiseId}
                      onChange={e => setBulkEditData(prev => ({ ...prev, franchiseId: e.target.value }))}>
                      <option value="">— keep existing —</option>
                      {franchises
                        .filter(f => !bulkEditData.capabilityId || String(f.capabilityId) === String(bulkEditData.capabilityId))
                        .map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Career Level</label>
                    <select className="form-select" value={bulkEditData.careerLevel}
                      onChange={e => setBulkEditData(prev => ({ ...prev, careerLevel: e.target.value }))}>
                      <option value="">— keep existing —</option>
                      {careerLevels.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Location</label>
                    <select className="form-select" value={bulkEditData.location}
                      onChange={e => setBulkEditData(prev => ({ ...prev, location: e.target.value }))}>
                      <option value="">— keep existing —</option>
                      {LOCATION_OPTIONS.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={bulkEditData.status}
                      onChange={e => setBulkEditData(prev => ({ ...prev, status: e.target.value }))}>
                      <option value="">— keep existing —</option>
                      {statuses.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Resource Type</label>
                    <select className="form-select" value={bulkEditData.resourceType}
                      onChange={e => setBulkEditData(prev => ({ ...prev, resourceType: e.target.value }))}>
                      <option value="">— keep existing —</option>
                      {userStatuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setBulkEditOpen(false)} disabled={bulkEditing}>Cancel</button>
                <button className="btn btn-primary" onClick={handleBulkEdit} disabled={bulkEditing}>
                  {bulkEditing ? "Saving…" : `Apply to ${selectedCount} user${selectedCount !== 1 ? "s" : ""}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default UserPage;
