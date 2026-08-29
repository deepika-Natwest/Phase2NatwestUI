import React from "react";
import * as XLSX from "xlsx";
import Layout from "../../components/admin/Layout";
import UploadUsersSection from "../../features/users/UploadUsersSection";

const TEMPLATE_HEADERS = [
  "Name", "Enterprise ID", "Email", "Role", "Career Level",
  "Location", "Capability", "Franchise",
  "Resource Type", "NatWest DOJ", "SOW Start Date", "SOW End Date", "SOW ID",
  "Project / Program", "NWG Line Manager",
];

function downloadTemplate() {
  try {
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    const base64 = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
    const a = document.createElement("a");
    a.href = "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64," + base64;
    a.download = "User_Upload_Template.xlsx";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.error("Template download failed:", err);
    alert("Download failed: " + err.message);
  }
}

export default function UploadUsersPage() {
  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center titleBox">
        <h2>Upload User Data</h2>
      </div>

      <div className="adminContent p-4">
        <UploadUsersSection />

        {/* Excel Layout Section */}
        <div className="mt-5">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4>Excel Upload Format</h4>

            <button className="btn btn-primary" onClick={downloadTemplate}>
              Download Template
            </button>
          </div>

          <p>Please follow the below format while uploading:</p>

          <div className="table-responsive">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Column</th>
                  <th>Description</th>
                  <th>Required</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Name</td>
                  <td>Full name of the user</td>
                  <td>Mandatory</td>
                </tr>
                <tr>
                  <td>Enterprise ID</td>
                  <td>Unique enterprise identifier</td>
                  <td>Mandatory</td>
                </tr>
                <tr>
                  <td>Email</td>
                  <td>Email address of the user</td>
                  <td>Mandatory</td>
                </tr>
                <tr>
                  <td>Role</td>
                  <td>User role (e.g. admin, editor, viewer)</td>
                  <td>Mandatory</td>
                </tr>
                <tr>
                  <td>Career Level</td>
                  <td>Career level of the user (e.g. Level 1)</td>
                  <td>Mandatory</td>
                </tr>
                <tr>
                  <td>Location</td>
                  <td>Work location of the user</td>
                  <td>Mandatory</td>
                </tr>
                <tr>
                  <td>Capability</td>
                  <td>Capability group the user belongs to</td>
                  <td>Mandatory</td>
                </tr>
                <tr>
                  <td>Franchise</td>
                  <td>Franchise the user belongs to</td>
                  <td>Mandatory</td>
                </tr>
                <tr>
                  <td>Resource Type</td>
                  <td>Type of resource (from User Status list)</td>
                  <td>Optional</td>
                </tr>
                <tr>
                  <td>NatWest DOJ</td>
                  <td>Date of joining NatWest (YYYY-MM-DD)</td>
                  <td>Optional</td>
                </tr>
                <tr>
                  <td>SOW Start Date</td>
                  <td>SOW start date (YYYY-MM-DD)</td>
                  <td>Optional</td>
                </tr>
                <tr>
                  <td>SOW End Date</td>
                  <td>SOW end date (YYYY-MM-DD)</td>
                  <td>Optional</td>
                </tr>
                <tr>
                  <td>SOW ID</td>
                  <td>Statement of Work ID</td>
                  <td>Optional</td>
                </tr>
                <tr>
                  <td>Project / Program</td>
                  <td>Project or program the user is assigned to (linked to Teams tab)</td>
                  <td>Optional</td>
                </tr>
                <tr>
                  <td>NWG Line Manager</td>
                  <td>NatWest line manager for the user (linked to Teams tab)</td>
                  <td>Optional</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-muted">
            * Please use the downloaded template only. Do not rename, delete,
            reorder, or add columns. First 8 mandatory, last 7 optional.
          </p>

          {/* Example Row */}
          <h5 className="mt-4 mb-3">Format Example</h5>
          <div className="table-responsive">
            <table className="table table-bordered table-sm" style={{ fontSize: "0.82rem" }}>
              <thead className="table-dark">
                <tr>
                  <th>Name</th>
                  <th>Enterprise ID</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Career Level</th>
                  <th>Location</th>
                  <th>Capability</th>
                  <th>Franchise</th>
                  <th>Resource Type</th>
                  <th>NatWest DOJ</th>
                  <th>SOW Start Date</th>
                  <th>SOW End Date</th>
                  <th>SOW ID</th>
                  <th style={{ background: "#4a235a", color: "#fff" }}>Project / Program</th>
                  <th style={{ background: "#4a235a", color: "#fff" }}>NWG Line Manager</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>John Smith</td>
                  <td>jsmith01</td>
                  <td>john.smith@accenture.com</td>
                  <td>editor</td>
                  <td>Level 7</td>
                  <td>Bangalore</td>
                  <td>Digital &amp; Cloud</td>
                  <td>Data Engineering</td>
                  <td>Permanent</td>
                  <td>2023-04-01</td>
                  <td>2024-01-01</td>
                  <td>2025-12-31</td>
                  <td>SOW-2024-001</td>
                  <td style={{ background: "#f5eeff" }}>NatWest Modernisation</td>
                  <td style={{ background: "#f5eeff" }}>Priya Sharma</td>
                </tr>
                <tr>
                  <td>Aisha Patel</td>
                  <td>apatel02</td>
                  <td>aisha.patel@accenture.com</td>
                  <td>viewer</td>
                  <td>Level 9</td>
                  <td>Mumbai</td>
                  <td>Risk &amp; Compliance</td>
                  <td>Regulatory Reporting</td>
                  <td>Contractor</td>
                  <td>2022-07-15</td>
                  <td>2023-06-01</td>
                  <td>2024-05-31</td>
                  <td>SOW-2023-042</td>
                  <td style={{ background: "#f5eeff" }}>Risk Transformation</td>
                  <td style={{ background: "#f5eeff" }}>Rahul Mehta</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-muted" style={{ fontSize: "0.82rem" }}>
            * Highlighted columns (Project / Program &amp; NWG Line Manager) are the newly added fields and appear in the Teams tab.
          </p>
        </div>
      </div>
    </Layout>
  );
}