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
              </tbody>
            </table>
          </div>

          <p className="text-muted">
            * Please use the downloaded template only. Do not rename, delete,
            reorder, or add columns. First 8 mandatory, last 5 optional.
          </p>
        </div>
      </div>
    </Layout>
  );
}