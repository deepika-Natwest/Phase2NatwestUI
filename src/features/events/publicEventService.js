import api from "../../services/api";

// Fetch all events for public display
export const getPublicEvents = () => api.get("/events");