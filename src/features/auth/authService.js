import axios from "axios";

const API_URL = "{process.env.REACT_APP_API_URL}/api";

export const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { username, password });
    return response.data; // { token, role, username }
  } catch (error) {
    throw error.response ? error.response.data : { message: "Network error" };
  }
};
