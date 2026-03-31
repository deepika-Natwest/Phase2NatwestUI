import api from "../../services/api";

// Fetch all recognition records for public display
export const getPublicRecognitions = () => api.get("/recognition");