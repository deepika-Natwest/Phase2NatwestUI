import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { ROLES } from "../../constants/roles";
import { getImageUrl } from "../../services/imageHelper";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/login", { username, password });

      // Store token
      localStorage.setItem("token", res.data.token);

      // Store role in uppercase (match your ROLES constants)
      const role = res.data.role.toUpperCase();
      if (![ROLES.ADMIN, ROLES.EDITOR, ROLES.VIEWER].includes(role)) {
        throw new Error("Invalid role returned from backend");
      }
      localStorage.setItem("role", role);

      // Redirect to dashboard
      navigate("/admin/dashboard");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="container">
      <div className='card rounded-5 mx-auto col-5'>
      <div className='headerBox p-3 height-inherit text-center' ><img src={getImageUrl("siteLogo.png")} alt="Natwest" /></div>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleLogin}  className="p-5">
        <div className="mb-3">
          <label className="form-label">Username</label>
          <input
            type="text"
            className="form-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary">Login</button>
      </form>
      </div>
    </div>
  );
};

export default LoginPage;