import api from "../../services/api";

export const getLeadership = () => api.get("/leadership");

export const createLeadership = (data) =>
  api.post("/leadership", data);

export const updateLeadership = (id, data) =>
  api.put(`/leadership/${id}`, data);

export const deleteLeadership = (id) =>
    api.delete(`/leadership/${id}`);
