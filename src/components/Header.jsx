// src/components/Header.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { getImageUrl } from "../services/imageHelper";
import "../assets/styles/custom.css";

function Header() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    navigate("/"); // redirect to home
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light headerBox">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          <img src={getImageUrl("siteLogo.png")} alt="Natwest" />
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">
                  Home 
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/deliverables">
                  Deliverables 
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/deliverables/ai">
                  AI 
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/teams">
                  Teams
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/leaderships">
                Leadership
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/events">
                Events
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/recognitions">
                Recognitions
              </Link>
            </li>
          </ul>
          {username && (
            <span className="navbar-text">
              {username}{" "}
              <button className="btn btn-sm btn-outline-secondary ms-2" onClick={handleLogout}>
                Logout
              </button>
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Header;
