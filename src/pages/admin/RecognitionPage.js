import React, { useEffect, useState } from "react";
import Layout from "../../components/admin/Layout";
import {
  getRecognitions,
  createRecognition,
  updateRecognition,
  deleteRecognition,
} from "../../features/recognition/recognitionService";
import { getUserRole } from "../../utils/tokenUtils";
import { hasAnyRole } from "../../utils/roleUtils";
import { ROLES } from "../../constants/roles";
import { GENDER_OPTIONS } from "../../utils/userConfig";

function RecognitionPage() {
  const role = getUserRole();

  const [recognitions, setRecognitions] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentRecog, setCurrentRecog] = useState(null);
  const [pic, setPic] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    designation: "",
    genderType: "",
    recognitionType: "",
    recognitionTag: "",
    shortDescription: "",
    recognitionDate: "",
  });

  // Bulk select / bulk edit state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({ recognitionType: "", recognitionDate: "" });
  const [bulkEditing, setBulkEditing] = useState(false);

  const loadData = async () => {
    const res = await getRecognitions();
    setRecognitions(res.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Bulk select helpers
  const allSelected = recognitions.length > 0 && recognitions.every(r => selectedIds.has(r.id));
  const someSelected = recognitions.some(r => selectedIds.has(r.id));
  const selectedCount = selectedIds.size;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(recognitions.map(r => r.id)));
    }
  };

  const toggleOne = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkDelete = async () => {
    setDeleting(true);
    try {
      await Promise.all([...selectedIds].map(id => deleteRecognition(id)));
      setSelectedIds(new Set());
      setConfirmDelete(false);
      await loadData();
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
          const existing = recognitions.find(r => r.id === id);
          const merged = { ...existing, ...changes };
          const data = new FormData();
          Object.entries(merged).forEach(([k, v]) => {
            if (v !== null && v !== undefined && k !== "pic") data.append(k, v);
          });
          return updateRecognition(id, data);
        })
      );
      setSelectedIds(new Set());
      setBulkEditOpen(false);
      await loadData();
    } finally {
      setBulkEditing(false);
    }
  };

  const openModal = (recog = null) => {
    setCurrentRecog(recog);
    setFormData(
      recog || {
        name: "",
        designation: "",
        genderType: "",
        recognitionType: "",
        recognitionTag: "",
        shortDescription: "",
        recognitionDate: new Date().toISOString().split("T")[0],
      }
    );
    setPic(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentRecog(null);
    setPic(null);
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();

    Object.keys(formData).forEach((key) =>
      data.append(key, formData[key])
    );

    if (pic) data.append("pic", pic);

    if (currentRecog) {
      await updateRecognition(currentRecog.id, data);
    } else {
      await createRecognition(data);
    }

    closeModal();
    loadData();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this recognition?")) {
      await deleteRecognition(id);
      loadData();
    }
  };

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center titleBox">
        <h2>Recognition Manager</h2>
        {hasAnyRole(role, [ROLES.ADMIN, ROLES.EDITOR]) && (
          <button className="btn btn-primary" onClick={() => openModal()}>
            Add Recognition
          </button>
        )}
      </div>

      {selectedCount > 0 && (
        <div className="px-4 pt-3 d-flex gap-2">
          {hasAnyRole(role, [ROLES.ADMIN]) && (
            <button
              className="btn btn-danger"
              onClick={() => setConfirmDelete(true)}
            >
              Delete Selected ({selectedCount})
            </button>
          )}
          {hasAnyRole(role, [ROLES.ADMIN, ROLES.EDITOR]) && (
            <button
              className="btn btn-warning"
              onClick={() => {
                setBulkEditData({ recognitionType: "", recognitionDate: "" });
                setBulkEditOpen(true);
              }}
            >
              Edit Selected ({selectedCount})
            </button>
          )}
        </div>
      )}

      <div className="adminContent p-4">
        <table className="table table-bordered table-striped">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                  onChange={toggleSelectAll}
                />
              </th>
              <th>Name</th>
              <th>Designation</th>
              <th>Type</th>
              <th>Tag</th>
              <th>Date</th>
              <th width="150">Actions</th>
            </tr>
          </thead>
          <tbody>
            {recognitions.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center">No records found.</td>
              </tr>
            )}
            {recognitions.map((r) => (
              <tr key={r.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(r.id)}
                    onChange={() => toggleOne(r.id)}
                  />
                </td>
                <td>{r.name}</td>
                <td>{r.designation}</td>
                <td>{r.recognitionType}</td>
                <td>{r.recognitionTag}</td>
                <td>
                  {r.recognitionDate
                    ? new Date(r.recognitionDate).toLocaleDateString(
                        "en-IN",
                        { day: "2-digit", month: "short", year: "numeric" }
                      )
                    : "-"}
                </td>
                <td>
                  {hasAnyRole(role, [ROLES.ADMIN, ROLES.EDITOR]) && (
                    <button
                      className="btn btn-sm btn-warning me-2"
                      onClick={() => openModal(r)}
                    >
                      Edit
                    </button>
                  )}
                  {hasAnyRole(role, [ROLES.ADMIN]) && (
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(r.id)}
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

      {/* Single-record Modal */}
      {modalOpen && (
        <div className="modal show fade d-block">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    {currentRecog
                      ? "Edit Recognition"
                      : "Add Recognition"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeModal}
                  />
                </div>

                <div className="modal-body row">

                  <div className="col-md-6 mb-3">
                    <label>Name</label>
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
                    <label>Designation</label>
                    <input
                      type="text"
                      name="designation"
                      className="form-control"
                      value={formData.designation}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label>Date</label>
                    <input
                      type="date"
                      name="recognitionDate"
                      className="form-control"
                      value={formData.recognitionDate || ""}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* FINAL DROPDOWN */}
                  <div className="col-md-6 mb-3">
                    <label>Recognition Type</label>
                    <select
                      name="recognitionType"
                      className="form-control"
                      value={formData.recognitionType}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select</option>
                      <option value="Townhall Recognition">
                        Townhall Recognition
                      </option>
                      <option value="ACE Award">ACE Award</option>
                      <option value="Employee of the Month">
                        Employee of the Month
                      </option>
                      <option value="Client Recognized">
                        Client Recognized
                      </option>
                    </select>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label>Gender</label>
                    <select
                      name="genderType"
                      className="form-control"
                      value={formData.genderType}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select</option>
                      {GENDER_OPTIONS.map((type) => (
                        <option key={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label>Department</label>
                    <input
                      type="text"
                      name="recognitionTag"
                      className="form-control"
                      value={formData.recognitionTag}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label>Pic</label>
                    <input
                      type="file"
                      className="form-control"
                      onChange={(e) => setPic(e.target.files[0])}
                    />
                  </div>

                  <div className="col-12 mb-3">
                    <label>Short Description</label>
                    <textarea
                      name="shortDescription"
                      className="form-control"
                      rows="3"
                      value={formData.shortDescription}
                      onChange={handleChange}
                    />
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

      {/* Confirm Bulk Delete Modal */}
      {confirmDelete && (
        <div className="modal show fade d-block">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setConfirmDelete(false)}
                ></button>
              </div>
              <div className="modal-body">
                Are you sure you want to delete {selectedCount} selected recognition(s)?
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleBulkDelete}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {bulkEditOpen && (
        <div className="modal show fade d-block">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Selected ({selectedCount})</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setBulkEditOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p className="text-muted small mb-3">
                  Only filled fields will be updated. Leave blank to keep existing values.
                </p>
                <div className="mb-3">
                  <label className="form-label">Recognition Type</label>
                  <select
                    className="form-control"
                    value={bulkEditData.recognitionType}
                    onChange={e => setBulkEditData(d => ({ ...d, recognitionType: e.target.value }))}
                  >
                    <option value="">— keep existing —</option>
                    <option value="Townhall Recognition">Townhall Recognition</option>
                    <option value="ACE Award">ACE Award</option>
                    <option value="Employee of the Month">Employee of the Month</option>
                    <option value="Client Recognized">Client Recognized</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Recognition Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={bulkEditData.recognitionDate}
                    onChange={e => setBulkEditData(d => ({ ...d, recognitionDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setBulkEditOpen(false)}
                  disabled={bulkEditing}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-success"
                  onClick={handleBulkEdit}
                  disabled={bulkEditing}
                >
                  {bulkEditing ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default RecognitionPage;
