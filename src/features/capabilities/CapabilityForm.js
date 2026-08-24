import React, { useState } from "react";

function CapabilityForm({ initialData = "", onSubmit }) {
  const [name, setName] = useState(initialData);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name });
  };

  return (
    <form onSubmit={handleSubmit}>
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

      <button type="submit" className="btn btn-success">
        Save
      </button>
    </form>
  );
}

export default CapabilityForm;