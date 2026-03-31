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
import { RECOGNITION_TYPES, GENDER_OPTIONS } from "../../utils/userConfig";

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
  });

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

    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
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

      <div className="adminContent p-4">
        <table className="table table-bordered table-striped">
          <thead>
            <tr>
              <th>Name</th>
              <th>Designation</th>
              <th>Type</th>
              <th>Tag</th>
              <th width="150">Actions</th>
            </tr>
          </thead>
          <tbody>
            {recognitions.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.designation}</td>
                <td>{r.recognitionType}</td>
                <td>{r.recognitionTag}</td>
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

      {modalOpen && (
        <div className="modal show fade d-block">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    {currentRecog ? "Edit Recognition" : "Add Recognition"}
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
                    <label>Recognition Type</label>
                    <select
                      name="recognitionType"
                      className="form-control"
                      value={formData.recognitionType}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select</option>
                      {RECOGNITION_TYPES.map((type) => (
                        <option key={type}>{type}</option>
                      ))}
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
    </Layout>
  );
}

export default RecognitionPage;