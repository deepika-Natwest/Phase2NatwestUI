// frontend/src/features/franchises/franchiseService.js
import api from "../../services/api";

// Get all franchises
export const getFranchises = () => api.get("/franchises");

// Get franchises filtered by capability
export const getFranchisesByCapability = (capabilityId) =>
  api.get(`/franchises/filter?capabilityId=${capabilityId}`);

// CRUD
export const createFranchise = (data) => api.post("/franchises", data);
export const updateFranchise = (id, data) => api.put(`/franchises/${id}`, data);
export const deleteFranchise = (id) => api.delete(`/franchises/${id}`);

// Get all capabilities for dropdown
export const getFranchiseCapabilities = () => api.get("/franchises/capabilities");