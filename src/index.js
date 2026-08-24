// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./app/AppRouter";  // Public Frontend Router
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";



const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppRouter />  {/* Public Frontend Routing */}
    </ThemeProvider>
  </React.StrictMode>
);