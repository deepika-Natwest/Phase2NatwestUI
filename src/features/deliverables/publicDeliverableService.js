import api from "../../services/api";

export const getPublicDeliverables = () => {
  return api.get("/deliverables");
};