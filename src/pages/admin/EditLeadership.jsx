import React, { useState, useEffect } from "react";
import api from "../../services/api";

function EditLeadership({ record, onClose, refresh }) {
  const [form, setForm] = useState(record);
  const [photo, setPhoto] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    setForm(record);
  }, [record]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    Object.keys(form).forEach((key) => {
      if (key !== "photo") {
        formData.append(key, form[key]);
      }
    });

    if (photo) {
      formData.append("photo", photo);
    }

    try {
     await api.post("/api/leadership/${record.id}", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      refresh();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  };

  return (
      <div className="modal show d-block" tabindex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div class="modal-header">
        <h5 class="modal-title">Edit Leadership</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={onClose}></button>
      </div>
      <div class="modal-body  p-3">
          <form onSubmit={handleSubmit}>
            <input className="form-control mb-2" name="name" value={form.name} onChange={handleChange} required />
            <input className="form-control mb-2" name="designation" value={form.designation} onChange={handleChange} required />
            <input className="form-control mb-2" name="location" value={form.location} onChange={handleChange} />
            <textarea className="form-control mb-2" name="description" value={form.description} onChange={handleChange} />

            <input
              type="file"
              className="form-control mb-3"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files[0])}
            />

            <button className="btn btn-primary">Update</button>
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

export default EditLeadership;
