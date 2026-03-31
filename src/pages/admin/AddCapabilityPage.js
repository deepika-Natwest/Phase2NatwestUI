import React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/admin/Layout";
import CapabilityForm from "../../features/capabilities/CapabilityForm";
import { createCapability } from "../../features/capabilities/capabilityService";

function AddCapabilityPage() {
  const navigate = useNavigate();

  const handleSubmit = async (data) => {
    await createCapability(data);
    navigate("/admin/capabilities");
  };

  return (
    <Layout>
      <h2>Add Capability</h2>
      <CapabilityForm onSubmit={handleSubmit} />
    </Layout>
  );
}

export default AddCapabilityPage;