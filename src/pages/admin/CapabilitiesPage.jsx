import React, { useEffect, useState } from "react";
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
  const [currentCapability, setCurrentCapability] = useState(null);
  const [name, setName] = useState("");

  // Load list
  const loadData = async () => {
    const res = await getCapabilities();
    setCapabilities(res.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Open modal for Add/Edit
  const openModal = (cap = null) => {
    setCurrentCapability(cap);
    setName(cap ? cap.name : "");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentCapability(null);
    setName("");
  };

  // Submit Add/Edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentCapability) {
      await updateCapability(currentCapability.id, { name });
    } else {
      await createCapability({ name });
    }
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
          <div className="row">
              <div className="col-4"></div>
              <div className="col-4"></div>
              <div className="col-4 text-end">
                 {hasAnyRole(role, [ROLES.ADMIN]) && (
                    <button className="btn btn-primary" onClick={() => openModal()} > Add Capability </button>
                  )}
              </div>
          </div>
      </div>
     
      <div className="adminContent p-4">
                    <table className="table table-bordered table-striped">
        <thead>
          <tr>
            <th>Name</th>
            <th width="150">Actions</th>
          </tr>
        </thead>
        <tbody>
          {capabilities.map((cap) => (
            <tr key={cap.id}>
              <td>{cap.name}</td>
              <td>
                {hasAnyRole(role, [ROLES.ADMIN, ROLES.EDITOR]) && (
                  <button
                    className="btn btn-sm btn-warning me-2"
                    onClick={() => openModal(cap)}
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>          
    

      {/* Bootstrap Modal */}
      {modalOpen && (
          <div class="modal show fade d-block" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">

          <div class="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    {currentCapability ? "Edit Capability" : "Add Capability"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeModal}
                  ></button>
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

export default CapabilitiesPage;