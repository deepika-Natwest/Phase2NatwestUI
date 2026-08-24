import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import "./admin.css"; 

function Layout({ children }) {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/admin/login");
  };

  return (
    <div className="d-flex adminShell">
      <Sidebar />
      <div className="flex-grow-1 adminMain">
        <Header username={username} onLogout={handleLogout} />
        {children}
      </div>
    </div>
  );
}

export default Layout;
