import api from "../../services/api";

// Fetch all leadership records for public display
export const getPublicLeadership = () => api.get("/leadership");