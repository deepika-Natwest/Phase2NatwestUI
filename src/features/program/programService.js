import api from "../../services/api";

export const getPrograms = () => api.get("/programs");
export const createProgram = (data) => api.post("/programs", data);
export const updateProgram = (id, data) => api.put(`/programs/${id}`, data);
export const deleteProgram = (id) => api.delete(`/programs/${id}`);
