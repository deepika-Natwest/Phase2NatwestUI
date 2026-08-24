import React, { useEffect, useRef, useState } from "react";
import Layout from "../../components/admin/Layout";
import {
  getPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
} from "../../features/programs/programService";
import { getCapabilities } from "../../features/capabilities/capabilityService";
import { getFranchises } from "../../features/franchises/franchiseService";
import { getUserRole } from "../../utils/tokenUtils";
import { hasAnyRole } from "../../utils/roleUtils";
import { ROLES } from "../../constants/roles";

function AddProgram() {
  const role = getUserRole();

  // ── Data ──────────────────────────────────────────────────────────────────
  const [programs, setPrograms] = useState([]);
  const [capabilities, setCapabilities] = useState([]);
  const [franchises, setFranchises] = useState([]);

  // ── Single add / edit modal ────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    capabilityId: "",
    franchiseId: "",
    isActive: true,
  });

  // ── Bulk select ────────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // ── Bulk edit ──────────────────────────────────────────────────────────────
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({
    capabilityId: "",
    franchiseId: "",
    isActive: "",
  });
  const [bulkEditing, setBulkEditing] = useState(false);

  const selectAllRef = useRef(null);

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadData = async () => {
    try {
      const [p, c, f] = await Promise.all([
        getPrograms(),
        getCapabilities(),
        getFranchises(),
      ]);
      setPrograms(p.data);
      setCapabilities(c.data);
      setFranchises(f.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ── Bulk-select helpers ────────────────────────────────────────────────────
  const allSelected =
    programs.length > 0 && selectedIds.size === programs.length;
  const someSelected =
    selectedIds.size > 0 && selectedIds.size < programs.length;
  const selectedCount = selectedIds.size;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(programs.map((p) => p.id)));
    }
  };

  const toggleOne = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // ── Single add / edit ──────────────────────────────────────────────────────
  const openModal = (item = null) => {
    setCurrentItem(item);
    setFormData(
      item
        ? {
            name: item.name || "",
            capabilityId: item.capabilityId || "",
            franchiseId: item.franchiseId || "",
            isActive: item.isActive ?? true,
          }
        : { name: "", capabilityId: "", franchiseId: "", isActive: true }
    );
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentItem(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      isActive:
        formData.isActive === true || formData.isActive === "true",
    };
    try {
      if (currentItem) {
        await updateProgram(currentItem.id, payload);
      } else {
        await createProgram(payload);
      }
      closeModal();
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Could not save program");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this program?")) return;
    try {
      await deleteProgram(id);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Could not delete program");
    }
  };

  // ── Bulk delete ────────────────────────────────────────────────────────────
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

  // ── Bulk edit ──────────────────────────────────────────────────────────────
  const handleBulkEdit = async () => {
    const rawChanges = Object.fromEntries(
      Object.entries(bulkEditData).filter(([, v]) => v !== "")
    );
    if (!Object.keys(rawChanges).length) {
      setBulkEditOpen(false);
      return;
    }
    const changes = { ...rawChanges };
    if (changes.isActive !== undefined) {
      changes.isActive = changes.isActive === "true";
    }
    setBulkEditing(true);
    try {
      await Promise.all(
        [...selectedIds].map((id) => updateProgram(id, changes))
      );
      setSelectedIds(new Set());
      setBulkEditOpen(false);
      await loadData();
    } finally {
      setBulkEditing(false);
    }
  };

  // ── Derived filtered lists ─────────────────────────────────────────────────
  const filteredFormFranchises = franchises.filter(
    (f) => f.capabilityId === formData.capabilityId
  );

  const bulkFilteredFranchises = bulkEditData.capabilityId
    ? franchises.filter((f) => f.capabilityId === bulkEditData.capabilityId)
    : franchises;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Layout>
      {/* Page header */}
      <div className="d-flex justify-content-between align-items-center titleBox">
        <h2>Program Manager</h2>
        {hasAnyRole(role, [ROLES.ADMIN, ROLES.EDITOR]) && (
          <button className="btn btn-primary" onClick={() => openModal()}>
            Add Program
          </button>
        )}
      </div>

      {/* Bulk action toolbar */}
      {selectedCount > 0 && !confirmDelete && (
        <div className="searchHeadBox p-3 d-flex align-items-center gap-2">
          <span className="me-2 fw-semibold">{selectedCount} selected</span>
          {hasAnyRole(role, [ROLES.ADMIN]) && (
            <button
              className="btn btn-danger btn-sm"
              onClick={() => setConfirmDelete(true)}
            >
              Delete Selected ({selectedCount})
            </button>
          )}
          {hasAnyRole(role, [ROLES.ADMIN, ROLES.EDITOR]) && (
            <button
              className="btn btn-warning btn-sm"
              onClick={() => {
                setBulkEditData({ capabilityId: "", franchiseId: "", isActive: "" });
                setBulkEditOpen(true);
              }}
            >
              Edit Selected ({selectedCount})
            </button>
          )}
        </div>
      )}

      {/* Bulk delete confirmation bar */}
      {confirmDelete && (
        <div className="searchHeadBox p-3 d-flex align-items-center gap-2">
          <span className="text-danger fw-bold me-2">
            Permanently delete {selectedCount} program(s)? This cannot be undone.
          </span>
          <button
            className="btn btn-danger btn-sm"
            disabled={deleting}
            onClick={handleBulkDelete}
          >
            {deleting ? "Deleting..." : "Confirm Delete"}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setConfirmDelete(false)}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Table */}
      <div className="adminContent p-4">
        <table className="table table-bordered table-striped">
          <thead>
            <tr>
              <th style={{ width: 40 }}>
                <input
                  type="checkbox"
                  ref={selectAllRef}
                  checked={allSelected}
                  onChange={toggleSelectAll}
                />
              </th>
              <th>Name</th>
              <th>BU (Capability)</th>
              <th>SBU (Franchise)</th>
              <th>Active</th>
              <th width="150">Actions</th>
            </tr>
          </thead>
          <tbody>
            {programs.map((p) => (
              <tr key={p.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(p.id)}
                    onChange={() => toggleOne(p.id)}
                  />
                </td>
                <td>{p.name}</td>
                <td>
                  {capabilities.find((c) => c.id === p.capabilityId)?.name || "—"}
                </td>
                <td>
                  {franchises.find((f) => f.id === p.franchiseId)?.name || "—"}
                </td>
                <td>{p.isActive ? "Yes" : "No"}</td>
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
          </tbody>
        </table>
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="modal show fade d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    {currentItem ? "Edit Program" : "Add Program"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeModal}
                  />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Program Name</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">BU (Capability)</label>
                    <select
                      name="capabilityId"
                      className="form-control"
                      value={formData.capabilityId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          capabilityId: e.target.value,
                          franchiseId: "",
                        })
                      }
                      required
                    >
                      <option value="">Select Capability</option>
                      {capabilities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">SBU (Franchise)</label>
                    <select
                      name="franchiseId"
                      className="form-control"
                      value={formData.franchiseId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Franchise</option>
                      {filteredFormFranchises.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3 form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      name="isActive"
                      id="isActiveCheck"
                      checked={!!formData.isActive}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="isActiveCheck">
                      Active
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeModal}
                  >
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

      {/* ── Bulk Edit Modal ──────────────────────────────────────────────────── */}
      {bulkEditOpen && (
        <div className="modal show fade d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Edit Selected Programs ({selectedCount})
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setBulkEditOpen(false)}
                />
              </div>
              <div className="modal-body">
                <p className="text-muted small mb-3">
                  Only filled fields will be updated. Leave blank to keep existing values.
                </p>
                <div className="mb-3">
                  <label className="form-label">BU (Capability)</label>
                  <select
                    className="form-control"
                    value={bulkEditData.capabilityId}
                    onChange={(e) =>
                      setBulkEditData({
                        ...bulkEditData,
                        capabilityId: e.target.value,
                        franchiseId: "",
                      })
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
                <div className="mb-3">
                  <label className="form-label">SBU (Franchise)</label>
                  <select
                    className="form-control"
                    value={bulkEditData.franchiseId}
                    onChange={(e) =>
                      setBulkEditData({
                        ...bulkEditData,
                        franchiseId: e.target.value,
                      })
                    }
                  >
                    <option value="">— keep existing —</option>
                    {bulkFilteredFranchises.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Active Status</label>
                  <select
                    className="form-control"
                    value={bulkEditData.isActive}
                    onChange={(e) =>
                      setBulkEditData({
                        ...bulkEditData,
                        isActive: e.target.value,
                      })
                    }
                  >
                    <option value="">— keep existing —</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setBulkEditOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={bulkEditing}
                  onClick={handleBulkEdit}
                >
                  {bulkEditing
                    ? "Applying..."
                    : `Apply to ${selectedCount} program(s)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default AddProgram;
