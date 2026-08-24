import api from "../../services/api";

export const getRecognitions = () => api.get("/recognition");

export const createRecognition = (data) =>
  api.post("/recognition", data);

export const updateRecognition = (id, data) =>
  api.put(`/recognition/${id}`, data);

export const deleteRecognition = (id) =>
  api.delete(`/recognition/${id}`);