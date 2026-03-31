// frontend/src/pages/admin/FranchisePage.jsx
import React, { useEffect, useState } from "react";
import Layout from "../../components/admin/Layout";
import {
  getFranchises,
  getFranchiseCapabilities,
  createFranchise,
  updateFranchise,
  deleteFranchise,
} from "../../features/franchises/franchiseService";
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

  const loadData = async () => {
    try {
      const fRes = await getFranchises();
      setFranchises(fRes.data);

      const cRes = await getFranchiseCapabilities();
      setCapabilities(cRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
        <div className="row">
          <div className="col-8"></div>
          <div className="col-4 text-end">
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
              <th>Franchise Name</th>
              <th>Capability</th>
              <th width="150">Actions</th>
            </tr>
          </thead>
          <tbody>
            {franchises.map((f) => (
              <tr key={f.id}>
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
                    <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
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
    </Layout>
  );
}

export default FranchisePage;