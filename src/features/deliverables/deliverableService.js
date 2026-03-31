import api from "../../services/api";

export const getDeliverables = () => {
  return api.get("/deliverables");
};

export const createDeliverable = (data) => {
  return api.post("/deliverables", data);
};

export const updateDeliverable = (id, data) => {
  return api.put(`/deliverables/${id}`, data);
};

export const deleteDeliverable = (id) => {
  return api.delete(`/deliverables/${id}`);
};