import React, { useState } from "react";
import api from "../../services/api";

function AddLeadership({ onClose, refresh }) {
  const [form, setForm] = useState({
    name: "",
    designation: "",
    location: "",
    description: "",
  });
  const [photo, setPhoto] = useState(null);

  const token = localStorage.getItem("token");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    Object.keys(form).forEach((key) => {
      formData.append(key, form[key]);
    });

    if (photo) {
      formData.append("photo", photo);
    }

    try {
     await api.post("/api/leadership", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      refresh();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to add leadership");
    }
  };

  return (
            <div className="modal show d-block" tabindex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div class="modal-header">
        <h5 class="modal-title">Add Leadership</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={onClose}></button>
      </div>
      <div class="modal-body  p-3">

          <form onSubmit={handleSubmit}>
            <input className="form-control mb-2" name="name" placeholder="Name" onChange={handleChange} required />
            <input className="form-control mb-2" name="designation" placeholder="Designation" onChange={handleChange} required />
            <input className="form-control mb-2" name="location" placeholder="Location" onChange={handleChange} />
            <textarea className="form-control mb-2" name="description" placeholder="Short Description" onChange={handleChange} />

            <input
              type="file"
              className="form-control mb-3"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files[0])}
            />

            <button className="btn btn-primary">Save</button>
            <button type="button" className="btn btn-secondary ms-2" onClick={onClose}>
              Cancel
            </button>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddLeadership;
