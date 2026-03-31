import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../../components/admin/Layout";
import CapabilityForm from "../../features/capabilities/CapabilityForm";
import {
  getCapabilities,
  updateCapability,
} from "../../features/capabilities/capabilityService";

function EditCapabilityPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const res = await getCapabilities();
      const cap = res.data.find((c) => c.id === id);
      if (cap) setName(cap.name);
    };
    loadData();
  }, [id]);

  const handleSubmit = async (data) => {
    await updateCapability(id, data);
    navigate("/admin/capabilities");
  };

  return (
    <Layout>
      <h2>Edit Capability</h2>
      <CapabilityForm initialData={name} onSubmit={handleSubmit} />
    </Layout>
  );
}

export default EditCapabilityPage;