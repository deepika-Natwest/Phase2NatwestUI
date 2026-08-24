import React, { useEffect, useRef, useState } from "react";
import Layout from "../../components/admin/Layout";
import {
  getDeliverables,
  createDeliverable,
  updateDeliverable,
  deleteDeliverable,
} from "../../features/deliverables/deliverableService";
import { getCapabilities } from "../../features/capabilities/capabilityService";
import { getFranchises } from "../../features/franchises/franchiseService";
import { getUsers } from "../../features/users/userService";
import { getUserRole } from "../../utils/tokenUtils";
import { hasAnyRole } from "../../utils/roleUtils";
import { ROLES } from "../../constants/roles";


const CATEGORY_OPTIONS = [
  "Cost Saving",
  "Process Improvement",
  "New Functionality",
];

const BULK_EDIT_CATEGORY_OPTIONS = [
  "Design",
  "Development",
  "Testing",
  "Documentation",
  "Deployment",
];

function DeliverablePage() {
  const role = getUserRole();

  const [deliverables, setDeliverables] = useState([]);
  const [capabilities, setCapabilities] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [users, setUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  const [formData, setFormData] = useState({
    deliveryTitle: "",
    capabilityId: "",
    franchiseId: "",
    category: "",
    aiBased: false,
    projectName: "",
    description: "",
    resources: [],

    // category-specific
    costSavingAmount: "",
    costSavingCurrency: "GPP",

    improvementType: "",
    timeHours: "",
    timeMinutes: "",
    percentage: "",

    newFunctionality: "",
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
    category: "",
  });
  const [bulkEditing, setBulkEditing] = useState(false);

  const selectAllRef = useRef(null);

  const loadData = async () => {
    const [d, c, f, u] = await Promise.all([
      getDeliverables(),
      getCapabilities(),
      getFranchises(),
      getUsers(),
    ]);
    setDeliverables(d.data);
    setCapabilities(c.data);
    setFranchises(f.data);
    setUsers(u.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ── Bulk-select helpers ────────────────────────────────────────────────────
  const allSelected =
    deliverables.length > 0 && selectedIds.size === deliverables.length;
  const someSelected =
    selectedIds.size > 0 && selectedIds.size < deliverables.length;
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
      setSelectedIds(new Set(deliverables.map((d) => d.id)));
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
      item || {
        deliveryTitle: "",
        capabilityId: "",
        franchiseId: "",
        category: "",
        aiBased: false,
        projectName: "",
        description: "",
        resources: [],
        costSavingAmount: "",
        costSavingCurrency: "GPP",

        improvementType: "",
        timeHours: "",
        timeMinutes: "",
        percentage: "",

        newFunctionality: "",
      }
    );
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentItem(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "category") {
      setFormData({
        ...formData,
        category: value,
        improvementType: "",
        costSavingAmount: "",
        timeHours: "",
        timeMinutes: "",
        percentage: "",
        newFunctionality: "",
      });
      return;
    }

    // reset when switching between Time / Percentage
    if (name === "improvementType") {
      setFormData({
        ...formData,
        improvementType: value,
        timeHours: "",
        timeMinutes: "",
        percentage: "",
      });
      return;
    }

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleResourceChange = (e) => {
    const selected = Array.from(e.target.selectedOptions).map(
      (opt) => opt.value
    );
    setFormData({ ...formData, resources: selected });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentItem) {
      await updateDeliverable(currentItem.id, formData);
    } else {
      await createDeliverable(formData);
    }
    closeModal();
    loadData();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this deliverable?")) {
      await deleteDeliverable(id);
      loadData();
    }
  };

  // ── Bulk delete ────────────────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    setDeleting(true);
    try {
      await Promise.all([...selectedIds].map((id) => deleteDeliverable(id)));
      setSelectedIds(new Set());
      setConfirmDelete(false);
      await loadData();
    } finally {
      setDeleting(false);
    }
  };

  // ── Bulk edit ──────────────────────────────────────────────────────────────
  const handleBulkEdit = async () => {
    const changes = Object.fromEntries(
      Object.entries(bulkEditData).filter(([, v]) => v !== "")
    );
    if (!Object.keys(changes).length) {
      setBulkEditOpen(false);
      return;
    }
    setBulkEditing(true);
    try {
      await Promise.all(
        [...selectedIds].map((id) => {
          const existing = deliverables.find((d) => d.id === id);
          return updateDeliverable(id, { ...existing, ...changes });
        })
      );
      setSelectedIds(new Set());
      setBulkEditOpen(false);
      await loadData();
    } finally {
      setBulkEditing(false);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const filteredFranchises = franchises.filter(
    (f) => f.capabilityId === formData.capabilityId
  );

  const bulkFilteredFranchises = bulkEditData.capabilityId
    ? franchises.filter((f) => f.capabilityId === bulkEditData.capabilityId)
    : franchises;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center titleBox">
        <h2>Deliverables Manager</h2>
        {hasAnyRole(role, [ROLES.ADMIN, ROLES.EDITOR]) && (
          <button className="btn btn-primary" onClick={() => openModal()}>
            Add Deliverable
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
                setBulkEditData({ capabilityId: "", franchiseId: "", category: "" });
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
            Permanently delete {selectedCount} deliverable(s)? This cannot be undone.
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
              <th>Title</th>
              <th>Project</th>
              <th>Category</th>
              <th>AI</th>
              <th width="150">Actions</th>
            </tr>
          </thead>
          <tbody>
            {deliverables.map((d) => (
              <tr key={d.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(d.id)}
                    onChange={() => toggleOne(d.id)}
                  />
                </td>
                <td>{d.deliveryTitle}</td>
                <td>{d.projectName}</td>
                <td>{d.category}</td>
                <td>{d.aiBased ? "Yes" : "No"}</td>
                <td>
                  {hasAnyRole(role, [ROLES.ADMIN, ROLES.EDITOR]) && (
                    <button
                      className="btn btn-sm btn-warning me-2"
                      onClick={() => openModal(d)}
                    >
                      Edit
                    </button>
                  )}
                  {hasAnyRole(role, [ROLES.ADMIN]) && (
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(d.id)}
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
        <div className="modal show fade d-block">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    {currentItem ? "Edit Deliverable" : "Add Deliverable"}
                  </h5>
                  <button className="btn-close" onClick={closeModal} />
                </div>

                <div className="modal-body row">
                  {/* ALL ORIGINAL FIELDS KEPT */}

                  <div className="col-md-12 mb-3">
                    <label>Title</label>
                    <input
                      type="text"
                      name="deliveryTitle"
                      className="form-control"
                      value={formData.deliveryTitle}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label>Capability</label>
                    <select
                      name="capabilityId"
                      className="form-control"
                      value={formData.capabilityId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select</option>
                      {capabilities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label>Franchise</label>
                    <select
                      name="franchiseId"
                      className="form-control"
                      value={formData.franchiseId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select</option>
                      {filteredFranchises.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label>Category</label>
                    <select
                      name="category"
                      className="form-control"
                      value={formData.category}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select</option>
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6 mb-3 d-flex align-items-end">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        name="aiBased"
                        checked={formData.aiBased}
                        onChange={handleChange}
                      />
                      <label className="form-check-label">
                        AI Based Project
                      </label>
                    </div>
                  </div>

                  {/* CONDITIONAL FIELDS */}

                  {formData.category === "Cost Saving" && (
                    <>
                      <div className="col-md-6 mb-3">
                        <label>Amount Saved : GPP </label>
                        <input
                          type="number"
                          name="costSavingAmount"
                          className="form-control"
                          value={formData.costSavingAmount}
                          onChange={handleChange}
                          required
                        />
                      </div>

                    </>
                  )}

                  {formData.category === "Process Improvement" && (
                    <>
                      {/* Type Selection */}
                      <div className="col-md-6 mb-3">
                        <label>Improvement Type</label>
                        <select
                          name="improvementType"
                          className="form-control"
                          value={formData.improvementType}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select</option>
                          <option value="Time">Time Saved</option>
                          <option value="Percentage">Percentage Improvement</option>
                        </select>
                      </div>

                      {/* Time Inputs */}
                      {formData.improvementType === "Time" && (
                        <>
                          <div className="col-md-6 mb-3">
                            <label>Time Saved (Hours)</label>
                            <input
                              type="number"
                              name="timeHours"
                              className="form-control"
                              value={formData.timeHours}
                              onChange={handleChange}
                              required
                            />
                          </div>

                          <div className="col-md-6 mb-3">
                            <label>Time Saved (Minutes)</label>
                            <input
                              type="number"
                              name="timeMinutes"
                              className="form-control"
                              value={formData.timeMinutes}
                              onChange={handleChange}
                              min="0"
                              max="59"
                              required
                            />
                          </div>
                        </>
                      )}

                      {/* Percentage Input */}
                      {formData.improvementType === "Percentage" && (
                        <div className="col-md-6 mb-3">
                          <label>Improvement (%)</label>
                          <input
                            type="number"
                            name="percentage"
                            className="form-control"
                            value={formData.percentage}
                            onChange={handleChange}
                            min="0"
                            max="100"
                            required
                          />
                        </div>
                      )}
                    </>
                  )}
                  {formData.category === "New Functionality" && (
                    <div className="col-12 mb-3">
                      <label>New Functionality</label>
                      <textarea
                        name="newFunctionality"
                        className="form-control"
                        rows="3"
                        value={formData.newFunctionality}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  )}

                  <div className="col-md-6 mb-3">
                    <label>Project Name</label>
                    <input
                      type="text"
                      name="projectName"
                      className="form-control"
                      value={formData.projectName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label>Resources</label>
                    <select
                      multiple
                      className="form-control"
                      value={formData.resources}
                      onChange={handleResourceChange}
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 mb-3">
                    <label>Description</label>
                    <textarea
                      name="description"
                      className="form-control"
                      rows="3"
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={closeModal}>
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
                  Edit Selected Deliverables ({selectedCount})
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
                  <label className="form-label">Capability (BU)</label>
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
                  <label className="form-label">Franchise (SBU)</label>
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
                  <label className="form-label">Category</label>
                  <select
                    className="form-control"
                    value={bulkEditData.category}
                    onChange={(e) =>
                      setBulkEditData({
                        ...bulkEditData,
                        category: e.target.value,
                      })
                    }
                  >
                    <option value="">— keep existing —</option>
                    {BULK_EDIT_CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
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
                    : `Apply to ${selectedCount} deliverable(s)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default DeliverablePage;
