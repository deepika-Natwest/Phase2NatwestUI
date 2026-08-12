// src/components/Header.jsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getImageUrl } from "../services/imageHelper";
import "../assets/styles/custom.css";

function Header() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const navClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  return (
    <nav className="navbar navbar-expand-lg navbar-light headerBox">
      <div className="container-fluid">

        <NavLink className="navbar-brand" to="/" end>
          <img src={getImageUrl("siteLogo.png")} alt="Natwest" />
        </NavLink>

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
              <NavLink to="/dashboard" className={navClass} end>
                Dashboard
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/pricing" className={navClass} end>
                SOW
              </NavLink>
            </li>
            


            <li className="nav-item">
              <NavLink to="/deliverables" className={navClass} end>
                Deliverables
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink to="/deliverables/ai" className={navClass}>
                AI
              </NavLink>
            </li>

            {/* This tab is to display team members in card format */}
            {/*
<li className="nav-item">
  <NavLink to="/teams" className={navClass} end>
    Teams
  </NavLink>
</li>
*/}
            <li className="nav-item">
              <NavLink to="/teams/table" className={navClass}>
                Teams 
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink to ="/program" className={navClass}>
              Program
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink to="/leaderships" className={navClass}>
                Leadership
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink to="/events" className={navClass}>
                Events
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink to="/recognitions" className={navClass}>
                Recognitions
              </NavLink>
            </li>

          </ul>

          {username && (
            <span className="navbar-text">
              {username}
              <button
                className="btn btn-sm btn-outline-secondary ms-2"
                onClick={handleLogout}
              >
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
