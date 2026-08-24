import api from "../../services/api";

export const getUserStatuses = () => api.get("/user-statuses");

export const createUserStatus = (data) => api.post("/user-statuses", data);

export const updateUserStatus = (id, data) => api.put(`/user-statuses/${id}`, data);

export const deleteUserStatus = (id) => api.delete(`/user-statuses/${id}`);
