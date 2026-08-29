import React, { useEffect, useRef, useState } from "react";
import api from "../../services/api";
import UserForm from "../../features/users/UserForm";
import Layout from "../../components/admin/Layout";
import { LOCATION_OPTIONS, CAREER_LEVELS } from "../../utils/userConfig";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
// Protect by role OR by the fixed admin ID ("1") in case role is ever corrupted
const isAdmin = (u) => u.id === "1" || (u.role || "").toUpperCase() === "ADMIN";

const CAREER_LEVEL_OPTIONS = CAREER_LEVELS || Array.from({ length: 12 }, (_, i) => `Level ${i + 1}`);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const UserPage = () => {
  // ── existing data ──────────────────────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [capabilities, setCapabilities] = useState([]);
  const [userStatuses, setUserStatuses] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  // ── bulk-select state ──────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // ── bulk-edit state ────────────────────────────────────────────────────────
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({
    capabilityId: "",
    franchiseId: "",
    careerLevel: "",
    location: "",
    resourceType: "",
  });
  const [bulkEditing, setBulkEditing] = useState(false);

  // ── select-all indeterminate ref ───────────────────────────────────────────
  const selectAllRef = useRef(null);

  // ── fetch on mount ─────────────────────────────────────────────────────────
  const fetchUsers = async () => {
    const res = await api.get("/users");
    setUsers(res.data);
  };

  useEffect(() => {
    fetchUsers();
    api.get("/franchises").then((res) => setFranchises(res.data)).catch(() => {});
    api.get("/capabilities").then((res) => setCapabilities(res.data)).catch(() => {});
    api.get("/user-statuses").then((res) => setUserStatuses(res.data)).catch(() => {});
  }, []);

  // ── derived values ─────────────────────────────────────────────────────────
  const filteredUsers = users.filter((u) =>
    (u.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const selectableUsers = filteredUsers.filter((u) => !isAdmin(u));
  const selectedCount = selectedIds.size;

  const allSelected =
    selectableUsers.length > 0 && selectableUsers.every((u) => selectedIds.has(u.id));
  const someSelected = selectableUsers.some((u) => selectedIds.has(u.id)) && !allSelected;

  // keep indeterminate in sync
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  // ── helpers ────────────────────────────────────────────────────────────────
  const getFranchiseName = (id) => {
    const f = franchises.find((f) => f.id === id);
    return f ? f.name : "";
  };

  const handleSearch = (e) => setSearch(e.target.value);

  // ── checkbox helpers ───────────────────────────────────────────────────────
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableUsers.map((u) => u.id)));
    }
  };

  const toggleOne = (id) => {
    const u = users.find((u) => u.id === id);
    if (!u || isAdmin(u)) return; // never add admin IDs
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // ── bulk delete ────────────────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    setDeleting(true);
    setDeleteError("");

    const tryDeleteBatch = async (ids) => {
      const failedIds = [];
      for (const id of ids) {
        try {
          await api.delete(`/users/${id}`);
        } catch (err) {
          const status = err?.response?.status;
          // 403 = admin protection, 404 = already deleted — neither is a real failure
          if (status !== 403 && status !== 404) failedIds.push(id);
        }
      }
      return failedIds;
    };

    try {
      // Safety net: never delete admin users even if somehow selected
      const safeIds = [...selectedIds].filter((id) => {
        if (id === "1") return false;
        const u = users.find((u) => u.id === id);
        return u && !isAdmin(u);
      });

      // First pass — sequential to avoid concurrent write race conditions
      let failedIds = await tryDeleteBatch(safeIds);

      // Auto-retry failed IDs once after a short pause (handles transient file locks)
      if (failedIds.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        failedIds = await tryDeleteBatch(failedIds);
      }

      setSelectedIds(new Set());
      setConfirmDelete(false);
      await fetchUsers();
      if (failedIds.length > 0)
        setDeleteError(`${failedIds.length} user(s) could not be deleted after retry. Please try again.`);
    } catch (err) {
      setDeleteError("Delete failed: " + (err?.message || "Unknown error"));
      await fetchUsers().catch(() => {});
    } finally {
      setDeleting(false);
    }
  };

  // ── bulk edit ──────────────────────────────────────────────────────────────
  const handleBulkEdit = async () => {
    setBulkEditing(true);
    try {
      // build change object — only non-empty fields
      const changes = {};
      Object.entries(bulkEditData).forEach(([key, val]) => {
        if (val !== "") changes[key] = val;
      });

      if (Object.keys(changes).length === 0) {
        setBulkEditOpen(false);
        return;
      }

      // skip admin users
      const targetIds = [...selectedIds].filter((id) => {
        const u = users.find((u) => u.id === id);
        return u && !isAdmin(u);
      });

      await Promise.all(targetIds.map((id) => api.put(`/users/${id}`, changes)));
      setBulkEditOpen(false);
      await fetchUsers();
    } finally {
      setBulkEditing(false);
    }
  };

  // franchise options filtered by selected capability in bulk-edit modal
  const filteredFranchisesForBulkEdit = bulkEditData.capabilityId
    ? franchises.filter((f) => String(f.capabilityId) === String(bulkEditData.capabilityId))
    : franchises;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <Layout>
      {/* ── Page title ── */}
      <div className="d-flex justify-content-between align-items-center titleBox">
        <h2>Users Manager</h2>
      </div>

      {/* ── Search + Add ── */}
      <div className="searchHeadBox p-3">
        <div className="row">
          <div className="col-4">
            <input
              type="text"
              className="form-control"
              placeholder="Search by name"
              value={search}
              onChange={handleSearch}
            />
          </div>
          <div className="col-4"></div>
          <div className="col-4 text-end">
            <button
              className="btn btn-success"
              onClick={() => {
                setEditUser(null);
                setShowModal(true);
              }}
            >
              Add User
            </button>
          </div>
        </div>
      </div>

      <div className="container mt-4">
        {/* ── Bulk-action toolbar ── */}
        {selectedCount > 0 && !confirmDelete && (
          <div className="d-flex align-items-center gap-2 mb-2">
            <span className="text-muted">{selectedCount} user(s) selected</span>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => setConfirmDelete(true)}
            >
              Delete Selected ({selectedCount})
            </button>
            <button
              className="btn btn-info btn-sm"
              onClick={() => {
                setBulkEditData({
                  capabilityId: "",
                  franchiseId: "",
                  careerLevel: "",
                  location: "",
                  resourceType: "",
                });
                setBulkEditOpen(true);
              }}
            >
              Edit Selected ({selectedCount})
            </button>
          </div>
        )}

        {/* ── Confirm-delete bar ── */}
        {confirmDelete && (
          <div className="alert alert-warning d-flex align-items-center gap-2 mb-2">
            <span>
              Are you sure you want to delete {selectedCount} user(s)? This cannot be undone.
            </span>
            <button
              className="btn btn-danger btn-sm"
              onClick={handleBulkDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Yes, Delete"}
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

        {/* ── Delete error banner ── */}
        {deleteError && (
          <div className="alert alert-danger d-flex justify-content-between align-items-center mb-2">
            <span>{deleteError}</span>
            <button className="btn-close btn-sm" onClick={() => setDeleteError("")} />
          </div>
        )}

        {/* ── Table ── */}
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  ref={(el) => {
                    selectAllRef.current = el;
                    if (el) el.indeterminate = someSelected;
                  }}
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  title="Select all non-admin users"
                />
              </th>
              <th>Name</th>
              <th>Enterprise ID</th>
              <th>Role</th>
              <th>Franchise</th>
              <th>Resource Type</th>
              <th>NatWest DOJ</th>
              <th>SOW ID</th>
              <th>SOW Start</th>
              <th>SOW End</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="11" className="text-center text-muted">
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id} style={isAdmin(u) ? { background: "#f8f0ff" } : undefined}>
                  <td>
                    {isAdmin(u) ? (
                      <span title="System admin — cannot be selected">🔒</span>
                    ) : (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(u.id)}
                        onChange={() => toggleOne(u.id)}
                      />
                    )}
                  </td>
                  <td>{u.name}</td>
                  <td>{u.enterpriseId}</td>
                  <td>{u.role}</td>
                  <td>{getFranchiseName(u.franchiseId)}</td>
                  <td>{u.resourceType || "-"}</td>
                  <td>{u.natwestDoj || "-"}</td>
                  <td>{u.sowId || "-"}</td>
                  <td>{u.sowStartDate || "-"}</td>
                  <td>{u.sowEndDate || "-"}</td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm me-1"
                      onClick={() => {
                        setEditUser(u);
                        setShowModal(true);
                      }}
                    >
                      Edit
                    </button>
                    {!isAdmin(u) && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={async () => {
                          if (window.confirm(`Delete user "${u.name}"?`)) {
                            await api.delete(`/users/${u.id}`);
                            fetchUsers();
                          }
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* ── Add / Edit user modal ── */}
        {showModal && (
          <UserForm
            onClose={() => {
              setShowModal(false);
              fetchUsers();
            }}
            user={editUser}
          />
        )}
      </div>

      {/* ── Bulk-edit modal ── */}
      {bulkEditOpen && (
        <>
          {/* backdrop */}
          <div
            className="modal-backdrop fade show"
            style={{ zIndex: 1040 }}
            onClick={() => !bulkEditing && setBulkEditOpen(false)}
          />

          <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ zIndex: 1050 }}
            role="dialog"
          >
            <div className="modal-dialog modal-lg" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    Bulk Edit — {selectedCount} user(s)
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => !bulkEditing && setBulkEditOpen(false)}
                    disabled={bulkEditing}
                  />
                </div>

                <div className="modal-body">
                  <p className="text-muted small mb-3">
                    Only fields you change will be updated. Leave a field as
                    "— keep existing —" to leave it unchanged.
                  </p>

                  <div className="row g-3">
                    {/* Capability (BU) */}
                    <div className="col-6">
                      <label className="form-label">Capability (BU)</label>
                      <select
                        className="form-select"
                        value={bulkEditData.capabilityId}
                        onChange={(e) =>
                          setBulkEditData((prev) => ({
                            ...prev,
                            capabilityId: e.target.value,
                            franchiseId: "", // reset dependent field
                          }))
                        }
                      >
                        <option value="">— keep existing —</option>
                        {capabilities.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Franchise (SBU) */}
                    <div className="col-6">
                      <label className="form-label">Franchise (SBU)</label>
                      <select
                        className="form-select"
                        value={bulkEditData.franchiseId}
                        onChange={(e) =>
                          setBulkEditData((prev) => ({
                            ...prev,
                            franchiseId: e.target.value,
                          }))
                        }
                      >
                        <option value="">— keep existing —</option>
                        {filteredFranchisesForBulkEdit.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Career Level */}
                    <div className="col-6">
                      <label className="form-label">Career Level</label>
                      <select
                        className="form-select"
                        value={bulkEditData.careerLevel}
                        onChange={(e) =>
                          setBulkEditData((prev) => ({
                            ...prev,
                            careerLevel: e.target.value,
                          }))
                        }
                      >
                        <option value="">— keep existing —</option>
                        {CAREER_LEVEL_OPTIONS.map((lvl) => (
                          <option key={lvl} value={lvl}>
                            {lvl}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Location */}
                    <div className="col-6">
                      <label className="form-label">Location</label>
                      <select
                        className="form-select"
                        value={bulkEditData.location}
                        onChange={(e) =>
                          setBulkEditData((prev) => ({
                            ...prev,
                            location: e.target.value,
                          }))
                        }
                      >
                        <option value="">— keep existing —</option>
                        {LOCATION_OPTIONS.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Resource Type */}
                    <div className="col-6">
                      <label className="form-label">Resource Type</label>
                      <select
                        className="form-select"
                        value={bulkEditData.resourceType}
                        onChange={(e) =>
                          setBulkEditData((prev) => ({
                            ...prev,
                            resourceType: e.target.value,
                          }))
                        }
                      >
                        <option value="">— keep existing —</option>
                        {userStatuses.map((s) => (
                          <option key={s.id ?? s.name} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setBulkEditOpen(false)}
                    disabled={bulkEditing}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleBulkEdit}
                    disabled={bulkEditing}
                  >
                    {bulkEditing
                      ? "Saving…"
                      : `Apply to ${selectedCount} user(s)`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default UserPage;
