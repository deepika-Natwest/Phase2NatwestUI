// src/components/Header.jsx
import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getImageUrl } from "../services/imageHelper";
import "../assets/styles/custom.css";

function Header() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    document.body.classList.add("public-nav-active");
    return () => document.body.classList.remove("public-nav-active");
  }, []);

  useEffect(() => {
    document.body.classList.toggle("public-nav-collapsed", collapsed);
    return () => document.body.classList.remove("public-nav-collapsed");
  }, [collapsed]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const navClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  return (
    <nav className={`navbar navbar-light headerBox publicSidebar${collapsed ? " collapsed" : ""}`}>
      <div className="publicSidebarTop">

        <NavLink className="navbar-brand" to="/" end>
          <img src={getImageUrl("siteLogo.png")} alt="Natwest" />
        </NavLink>

        <button
          className="sidebarToggle publicSidebarToggle"
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          title={collapsed ? "Expand navigation" : "Collapse navigation"}
        >
          {collapsed ? ">" : "<"}
        </button>
      </div>

      <div className="publicSidebarLinks">
        <ul className="navbar-nav">



             <li className="nav-item">
              <NavLink to="/dashboard" className={navClass} end title="Dashboard">
                Dashboard
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/pricing" className={navClass} end title="SOW">
                SOW
              </NavLink>
            </li>



            <li className="nav-item">
              <NavLink to="/deliverables" className={navClass} end title="Deliverables">
                Deliverables
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink to="/deliverables/ai" className={navClass} title="AI">
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
              <NavLink to="/teams/table" className={navClass} title="Teams">
                Teams
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink to ="/program" className={navClass} title="Program">
              Program
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink to="/leaderships" className={navClass} title="Leadership">
                Leadership
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink to="/events" className={navClass} title="Events">
                Events
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink to="/recognitions" className={navClass} title="Recognitions">
                Recognitions
              </NavLink>
            </li>

        </ul>

        {username && (
            <span className="navbar-text publicSidebarUser">
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
    </nav>
  );
}

export default Header;
