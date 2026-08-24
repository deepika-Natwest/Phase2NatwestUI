// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./app/AppRouter";  // Public Frontend Router
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";



const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AppRouter />  {/* Public Frontend Routing */}
  </React.StrictMode>
);
