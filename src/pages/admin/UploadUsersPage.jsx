import React from "react";
import Layout from "../../components/admin/Layout";
import UploadUsersSection from "../../features/users/UploadUsersSection";

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

            <a
              href="/User_Upload_Template.xlsx"
              download
              className="btn btn-primary"
            >
              Download Template
            </a>
          </div>

          <p>Please follow the below format while uploading:</p>

          <div className="table-responsive">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Enterprise ID</th>
                  <th>Capability</th>
                  <th>Franchise</th>
                  <th>Level</th>
                  <th>Work Location</th>
                  <th>Project/Program</th>
                  <th>NWG Line Manager</th>
                  <th>Resource Type</th>
                  <th>NatWest DOJ</th>
                  <th>SOW Start Date</th>
                  <th>SOW End Date</th>
                  <th>SOW ID</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>John Doe</td>
                  <td>EMP001</td>
                  <td>D&A+</td>
                  <td>FinCrime</td>
                  <td>L2</td>
                  <td>Gurugram</td>
                  <td>Project A</td>
                  <td>Manager 1</td>
                  <td>Active-Billable</td>
                  <td>2024-01-15</td>
                  <td>2024-04-01</td>
                  <td>2025-03-31</td>
                  <td>SOW-2024-001</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-muted">
            * Please use the downloaded template only. Do not rename, delete,
            reorder, or add columns. The first 8 columns are mandatory; Resource Type, NatWest DOJ, SOW Start Date, SOW End Date, and SOW ID are optional.
          </p>
        </div>
      </div>
    </Layout>
  );
}