// frontend/src/pages/admin/FranchisePage.jsx
import React, { useEffect, useRef, useState } from "react";
import Layout from "../../components/admin/Layout";
import {
  getFranchises,
  createFranchise,
  updateFranchise,
  deleteFranchise,
} from "../../features/franchises/franchiseService";
import { getCapabilities } from "../../features/capabilities/capabilityService";
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

  // Bulk select
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Bulk edit
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({ capabilityId: "" });
  const [bulkEditing, setBulkEditing] = useState(false);

  const loadData = async () => {
    try {
      const fRes = await getFranchises();
      setFranchises(fRes.data);

      const cRes = await getCapabilities();
      setCapabilities(cRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Bulk select helpers
  const selectedCount = selectedIds.size;
  const allSelected = franchises.length > 0 && franchises.every(f => selectedIds.has(f.id));
  const someSelected = !allSelected && franchises.some(f => selectedIds.has(f.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(franchises.map(f => f.id)));
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
    setDeleting(true);
    try {
      await Promise.all([...selectedIds].map(id => deleteFranchise(id)));
      setSelectedIds(new Set());
      setConfirmDelete(false);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Could not delete selected franchises");
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
        [...selectedIds].map(id => updateFranchise(id, changes))
      );
      setSelectedIds(new Set());
      setBulkEditOpen(false);
      await loadData();
    } finally {
      setBulkEditing(false);
    }
  };

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

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center titleBox">
        <h2>Franchise Manager</h2>
      </div>

      <div className="searchHeadBox p-3">
        <div className="row align-items-center">
          <div className="col-6">
            {selectedCount > 0 && !confirmDelete && (
              <span className="d-flex gap-2">
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete Selected ({selectedCount})
                </button>
                <button
                  className="btn btn-warning btn-sm"
                  onClick={() => {
                    setBulkEditData({ capabilityId: "" });
                    setBulkEditOpen(true);
                  }}
                >
                  Edit Selected ({selectedCount})
                </button>
              </span>
            )}
            {confirmDelete && (
              <span className="d-flex align-items-center gap-2">
                <span>Delete {selectedCount} item(s)?</span>
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
              </span>
            )}
          </div>
          <div className="col-6 text-end">
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
              <th>Franchise Name</th>
              <th>Capability</th>
              <th width="150">Actions</th>
            </tr>
          </thead>
          <tbody>
            {franchises.map((f) => (
              <tr key={f.id}>
                {hasAnyRole(role, [ROLES.ADMIN]) && (
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(f.id)}
                      onChange={() => toggleOne(f.id)}
                    />
                  </td>
                )}
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
          </tbody>
        </table>
      </div>

      {/* Add / Edit Franchise Modal */}
      {modalOpen && (
        <div className="modal show fade d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">{currentFranchise ? "Edit Franchise" : "Add Franchise"}</h5>
                  <button type="button" className="btn-close" onClick={closeModal}></button>
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
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
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

      {/* Bulk Edit Modal */}
      {bulkEditOpen && (
        <div className="modal show fade d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Selected Franchises</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setBulkEditOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Capability (BU)</label>
                  <select
                    className="form-select"
                    value={bulkEditData.capabilityId}
                    onChange={(e) =>
                      setBulkEditData(prev => ({ ...prev, capabilityId: e.target.value }))
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
                  className="btn btn-success"
                  onClick={handleBulkEdit}
                  disabled={bulkEditing}
                >
                  {bulkEditing ? "Applying…" : `Apply to ${selectedCount} franchise(s)`}
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
