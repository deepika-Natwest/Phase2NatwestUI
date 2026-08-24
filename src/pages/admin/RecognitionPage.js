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

  const allSelected = recognitions.length > 0 && recognitions.every(r => selectedIds.has(r.id));
  const someSelected = recognitions.some(r => selectedIds.has(r.id)) && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(recognitions.map(r => r.id)));
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

  const selectedCount = selectedIds.size;

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
        <div className="searchHeadBox p-3">
          <div className="d-flex justify-content-center gap-2">
            {hasAnyRole(role, [ROLES.ADMIN]) && !confirmDelete && (
              <>
                <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
                  Delete Selected ({selectedCount})
                </button>
                {hasAnyRole(role, [ROLES.ADMIN, ROLES.EDITOR]) && (
                  <button className="btn btn-info" onClick={() => { setBulkEditData({ recognitionType: "", recognitionDate: "" }); setBulkEditOpen(true); }}>
                    Edit Selected ({selectedCount})
                  </button>
                )}
              </>
            )}
            {confirmDelete && (
              <div className="d-inline-flex align-items-center gap-2 border border-danger rounded px-3 py-1" style={{ background: "#fff5f5" }}>
                <span className="text-danger fw-semibold" style={{ fontSize: "14px" }}>
                  Delete {selectedCount} recognition{selectedCount !== 1 ? "s" : ""}?
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
        </div>
      )}

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
              <th>Designation</th>
              <th>Type</th>
              <th>Tag</th>
              <th>Date</th>
              <th width="150">Actions</th>
            </tr>
          </thead>
          <tbody>
            {recognitions.map((r) => (
              <tr key={r.id} style={selectedIds.has(r.id) ? { background: "#fff1f1" } : undefined}>
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
            {recognitions.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center text-muted py-4">No recognitions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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

                  {/* ✅ FINAL DROPDOWN */}
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
      {bulkEditOpen && (
        <div className="modal show fade d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Bulk Edit — {selectedCount} recognition{selectedCount !== 1 ? "s" : ""}</h5>
                <button type="button" className="btn-close" onClick={() => setBulkEditOpen(false)} />
              </div>
              <div className="modal-body">
                <p className="text-muted small mb-3">Leave a field blank to keep existing values unchanged.</p>
                <div className="mb-3">
                  <label className="form-label">Recognition Type</label>
                  <select className="form-select" value={bulkEditData.recognitionType}
                    onChange={e => setBulkEditData(prev => ({ ...prev, recognitionType: e.target.value }))}>
                    <option value="">— keep existing —</option>
                    <option value="Townhall Recognition">Townhall Recognition</option>
                    <option value="ACE Award">ACE Award</option>
                    <option value="Employee of the Month">Employee of the Month</option>
                    <option value="Client Recognized">Client Recognized</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Recognition Date</label>
                  <input type="date" className="form-control" value={bulkEditData.recognitionDate}
                    onChange={e => setBulkEditData(prev => ({ ...prev, recognitionDate: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setBulkEditOpen(false)} disabled={bulkEditing}>Cancel</button>
                <button className="btn btn-primary" onClick={handleBulkEdit} disabled={bulkEditing}>
                  {bulkEditing ? "Saving…" : `Apply to ${selectedCount} recognition${selectedCount !== 1 ? "s" : ""}`}
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
