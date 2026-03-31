import api from "../../services/api";

export const getCapabilities = () => api.get("/capabilities");

export const createCapability = (data) =>
  api.post("/capabilities", data);

export const updateCapability = (id, data) =>
  api.put(`/capabilities/${id}`, data);

export const deleteCapability = (id) =>
  api.delete(`/capabilities/${id}`);