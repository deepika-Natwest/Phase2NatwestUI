import React from "react";

const AddProgram = () => {
  return (
    <div
      style={{
        padding: "100px 30px 30px",
        minHeight: "100vh",
        background: "#f8f9fa",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          background: "#fff",
          borderRadius: "12px",
          padding: "30px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ marginBottom: "10px" }}>
          Add Program
        </h2>

        <p
          style={{
            color: "#6c757d",
            marginBottom: "25px",
          }}
        >
          This page is currently under development.
        </p>

        <div
          style={{
            padding: "20px",
            border: "1px dashed #0d6efd",
            borderRadius: "8px",
            background: "#f8fbff",
          }}
        >
          <h5>Planned Features</h5>

          <ul>
            <li>Create New Program</li>
            <li>Edit Existing Program</li>
            <li>Assign Employees</li>
            <li>Select Line Manager</li>
            <li>Map Capability (SBU)</li>
            <li>Map Franchise (BU)</li>
            <li>Save Program Details</li>
          </ul>
        </div>

        <div
          className="mt-4"
          style={{
            color: "#dc3545",
            fontWeight: "500",
          }}
        >
         In Progress
        </div>
      </div>
    </div>
  );
};

export default AddProgram;