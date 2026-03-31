import api from "../../services/api";

// Fetch all users for public display
export const getPublicUsers = () => api.get("/users");