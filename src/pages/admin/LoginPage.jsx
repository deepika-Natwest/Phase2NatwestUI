import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { ROLES } from "../../constants/roles";
import { getImageUrl } from "../../services/imageHelper";
import "../../assets/styles/custom.css";

const LoginPage = () => {
  const [enterpriseId, setEnterpriseId] = useState(""); // renamed from username
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Send login request
      const res = await api.post("/login", {
        username: enterpriseId.trim().toLowerCase(), // case-insensitive
        password
      });

      // Store token & role
      localStorage.setItem("token", res.data.token);
      const role = res.data.role.toUpperCase();
      if (![ROLES.ADMIN, ROLES.EDITOR, ROLES.VIEWER].includes(role)) {
        throw new Error("Invalid role returned from backend");
      }
      localStorage.setItem("role", role);

      // Redirect
      navigate("/admin/dashboard");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="container d-flex align-content-center flex-wrap loginPage ">
      <div className='card rounded-5 mx-auto col-5'>
        <div className='headerBox p-3 height-inherit text-center' ><img src={getImageUrl("siteLogo.png")} alt="Natwest" /></div>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleLogin} className="p-5">
          <div className="mb-3">
            <label>Enterprise ID</label>
            <input
              type="text"
              className="form-control"
              value={enterpriseId}
              onChange={(e) => setEnterpriseId(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;