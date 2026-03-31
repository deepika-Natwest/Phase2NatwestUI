import React, { useState } from "react";
import api from "../../services/api";

export default function UploadUsersSection() {
  const [file, setFile] = useState(null);

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/users/upload", formData);
      alert(`${res.data.message} (${res.data.count} records)`);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }
  };

  return (
    <div className="card p-3">
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        className="form-control mb-2"
      />
      <button className="btn btn-primary" onClick={handleUpload}>
        Upload Users
      </button>
    </div>
  );
}