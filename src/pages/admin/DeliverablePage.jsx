import React, { useEffect, useState } from "react";
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

function DeliverablePage() {
  const role = getUserRole();

  const [deliverables, setDeliverables] = useState([]);
  const [capabilities, setCapabilities] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [users, setUsers] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  const [formData, setFormData] = useState({
    deliveryTitle:"",
    capabilityId: "",
    franchiseId: "",
    category: "",
    aiBased: false,
    projectName: "",
    description: "",
    resources: [],
  });

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

  const openModal = (item = null) => {
    setCurrentItem(item);

    setFormData(
      item || {
        deliveryTitle:"",
        capabilityId: "",
        franchiseId: "",
        category: "",
        aiBased: false,
        projectName: "",
        description: "",
        resources: [],
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

  const filteredFranchises = franchises.filter(
    (f) => f.capabilityId === formData.capabilityId
  );

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

      <div className="adminContent p-4">
        <table className="table table-bordered table-striped">
          <thead>
            <tr>
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

      {modalOpen && (
        <div className="modal show fade d-block">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    {currentItem ? "Edit Deliverable" : "Add Deliverable"}
                  </h5>

                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeModal}
                  />
                </div>

                <div className="modal-body row">
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
    </Layout>
  );
}

export default DeliverablePage;