import React, { useEffect, useState } from "react";
import Layout from "../../components/admin/Layout";
import api from "../../services/api";

function DashboardPage() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get("/dashboard");
        setMessage(res.data.message);
      } catch (err) {
        setMessage("Could not load dashboard");
      }
    };

    fetchDashboard();
  }, []);

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center titleBox">
        <h2>Admin Dashboard</h2>
      </div>

    </Layout>
  );
}

export default DashboardPage;