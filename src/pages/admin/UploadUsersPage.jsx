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
      </div>
    </Layout>
  );
}