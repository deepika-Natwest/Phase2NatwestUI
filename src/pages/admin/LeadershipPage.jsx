import React, { useEffect, useState } from "react";
import Layout from "../../components/admin/Layout";
import {
  getLeadership,
  createLeadership,
  updateLeadership,
  deleteLeadership,
} from "../../features/leadership/leadershipService";
import { getUserRole } from "../../utils/tokenUtils";
import { hasAnyRole } from "../../utils/roleUtils";
import { ROLES } from "../../constants/roles";
import { LOCATION_OPTIONS, MANAGEMENT_LEVEL } from "../../utils/userConfig";


function LeadershipPage() {
  const role = getUserRole();

  const [leaders, setLeaders] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentLeader, setCurrentLeader] = useState(null);
  const [profilePic, setProfilePic] = useState(null);

  const [formData, setFormData] = useState({
    managementLevel: "",
    name: "",
    designation: "",
    location: "",
    shortDescription: "",
  });

  // Bulk select / bulk edit state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({ managementLevel: "", location: "" });
  const [bulkEditing, setBulkEditing] = useState(false);

  // Load list
  const loadData = async () => {
    const res = await getLeadership();
    setLeaders(res.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Bulk select helpers
  const allSelected = leaders.length > 0 && leaders.every(l => selectedIds.has(l.id));
  const someSelected = leaders.some(l => selectedIds.has(l.id));
  const selectedCount = selectedIds.size;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leaders.map(l => l.id)));
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
      await Promise.all([...selectedIds].map(id => deleteLeadership(id)));
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
          const existing = leaders.find(l => l.id === id);
          const merged = { ...existing, ...changes };
          const data = new FormData();
          Object.entries(merged).forEach(([k, v]) => {
            if (v !== null && v !== undefined && k !== "profilePic") data.append(k, v);
          });
          return updateLeadership(id, data);
        })
      );
      setSelectedIds(new Set());
      setBulkEditOpen(false);
      await loadData();
    } finally {
      setBulkEditing(false);
    }
  };

  const openModal = (leader = null) => {
    setCurrentLeader(leader);
    setFormData(
      leader || {
            managementLevel: "",
            name: "",
            designation: "",
            location: "",
            shortDescription: "",
      }
    );
    setProfilePic(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentLeader(null);
    setProfilePic(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    if (profilePic) {data.append("profilePic", profilePic);}

    if (currentLeader) {
      await updateLeadership(currentLeader.id, data);
    } else {
      await createLeadership(data);
    }

    closeModal();
    loadData();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this leadership record?")) {
      await deleteLeadership(id);
      loadData();
    }
  };

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center titleBox">
        <h2>Leadership Manager</h2>
      </div>

      <div className="searchHeadBox p-3">
        <div className="row align-items-center">
          <div className="col-8">
            {selectedCount > 0 && (
              <div className="d-flex gap-2">
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
                      setBulkEditData({ managementLevel: "", location: "" });
                      setBulkEditOpen(true);
                    }}
                  >
                    Edit Selected ({selectedCount})
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="col-4 text-end">
            {hasAnyRole(role, [ROLES.ADMIN, ROLES.EDITOR]) && (
              <button
                className="btn btn-primary"
                onClick={() => openModal()}
              >
                Add Leadership
              </button>
            )}
          </div>
        </div>
      </div>

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
              <th>Management Level</th>
              <th>Designation</th>
              <th>Location</th>
              <th width="180">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leaders.map((leader) => (
              <tr key={leader.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(leader.id)}
                    onChange={() => toggleOne(leader.id)}
                  />
                </td>
                <td>{leader.name}</td>
                <td>{leader.managementLevel}</td>
                <td>{leader.designation}</td>
                <td>{leader.location}</td>
                <td>
                  {hasAnyRole(role, [ROLES.ADMIN, ROLES.EDITOR]) && (
                    <button
                      className="btn btn-sm btn-warning me-2"
                      onClick={() => openModal(leader)}
                    >
                      Edit
                    </button>
                  )}
                  {hasAnyRole(role, [ROLES.ADMIN]) && (
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(leader.id)}
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
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    {currentLeader ? "Edit Leadership" : "Add Leadership"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeModal}
                  ></button>
                </div>

                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                        <label className="form-label">Management Level</label>
                        <select
                        name="managementLevel"
                        className="form-control"
                        value={formData.managementLevel}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Management Level</option>
                        {MANAGEMENT_LEVEL.map((loc) => (
                          <option key={loc}>{loc}</option>
                        ))}
                      </select>
                      </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Name</label>
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
                      <label className="form-label">Designation</label>
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
                      <label className="form-label">Location</label>
                      <select
                        name="location"
                        className="form-control"
                        value={formData.location}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select Location</option>
                        {LOCATION_OPTIONS.map((loc) => (
                          <option key={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Profile Picture</label>
                      <input
                        type="file"
                        className="form-control"
                        onChange={(e) =>
                          setProfilePic(e.target.files[0])
                        }
                      />
                    </div>

                    <div className="col-12 mb-3">
                      <label className="form-label">
                        Short Description
                      </label>
                      <textarea
                        name="shortDescription"
                        className="form-control"
                        rows="3"
                        value={formData.shortDescription}
                        onChange={handleChange}
                      />
                    </div>
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
                Are you sure you want to delete {selectedCount} selected record(s)?
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
                  <label className="form-label">Management Level</label>
                  <select
                    className="form-control"
                    value={bulkEditData.managementLevel}
                    onChange={e => setBulkEditData(d => ({ ...d, managementLevel: e.target.value }))}
                  >
                    <option value="">— keep existing —</option>
                    {MANAGEMENT_LEVEL.map(lvl => (
                      <option key={lvl}>{lvl}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Location</label>
                  <select
                    className="form-control"
                    value={bulkEditData.location}
                    onChange={e => setBulkEditData(d => ({ ...d, location: e.target.value }))}
                  >
                    <option value="">— keep existing —</option>
                    {LOCATION_OPTIONS.map(loc => (
                      <option key={loc}>{loc}</option>
                    ))}
                  </select>
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

export default LeadershipPage;
