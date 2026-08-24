import React from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, roles }) {
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  if (roles && !roles.includes(role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
