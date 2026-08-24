// tokenUtils.js
export const getUserRole = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    // Decode JWT payload (without verifying signature for frontend use)
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role;
  } catch (err) {
    return null;
  }
};