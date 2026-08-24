// src/components/Header.jsx
import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getImageUrl } from "../services/imageHelper";
import "../assets/styles/custom.css";

const POSITIONS = ["left", "top", "right", "bottom"];
const POSITION_NEXT_LABEL = { left: "⬆ Top", top: "➡ Right", right: "⬇ Bottom", bottom: "⬅ Left" };

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", abbr: "Db", end: true },
  { to: "/pricing",   label: "SOW",        abbr: "SW", end: true },
  { to: "/deliverables", label: "Deliverables", abbr: "Dl", end: true },
  { to: "/deliverables/ai", label: "AI",    abbr: "AI" },
  { to: "/teams/table",    label: "Teams",  abbr: "Tm" },
  { to: "/program",        label: "Program", abbr: "Pr" },
  { to: "/leaderships",    label: "Leadership", abbr: "Ld" },
  { to: "/events",         label: "Events", abbr: "Ev" },
  { to: "/recognitions",   label: "Recognitions", abbr: "Rg" },
];

function Header() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  const [navPosition, setNavPosition] = useState(
    () => localStorage.getItem("navPosition") || "left"
  );
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isVertical = navPosition === "left" || navPosition === "right";

  useEffect(() => {
    document.body.classList.add("public-nav-active");
    POSITIONS.forEach((p) => document.body.classList.remove(`nav-pos-${p}`));
    document.body.classList.add(`nav-pos-${navPosition}`);
    localStorage.setItem("navPosition", navPosition);
    return () => {
      document.body.classList.remove("public-nav-active");
      POSITIONS.forEach((p) => document.body.classList.remove(`nav-pos-${p}`));
    };
  }, [navPosition]);

  useEffect(() => {
    if (isVertical) {
      document.body.classList.toggle("public-nav-collapsed", collapsed);
    } else {
      document.body.classList.remove("public-nav-collapsed");
    }
    return () => document.body.classList.remove("public-nav-collapsed");
  }, [collapsed, isVertical]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const cyclePosition = () => {
    setNavPosition((prev) => {
      const idx = POSITIONS.indexOf(prev);
      return POSITIONS[(idx + 1) % POSITIONS.length];
    });
  };

  const navClass = ({ isActive }) => (isActive ? "nav-link active" : "nav-link");

  const collapseLabel =
    navPosition === "right"
      ? collapsed ? "<" : ">"
      : collapsed ? ">" : "<";

  const filteredNavItems = NAV_ITEMS.filter((item) =>
    !searchQuery || item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <nav
      className={`navbar navbar-light headerBox publicSidebar${
        isVertical && collapsed ? " collapsed" : ""
      }`}
    >
      <div className="publicSidebarTop">
        <NavLink className="navbar-brand" to="/" end>
          <img src={getImageUrl("siteLogo.png")} alt="Natwest" />
        </NavLink>

        <div className="d-flex gap-1 align-items-center">
          <button
            className="sidebarToggle publicSidebarToggle navPositionBtn"
            type="button"
            onClick={cyclePosition}
            title={`Move nav: ${POSITION_NEXT_LABEL[navPosition]}`}
            style={{ fontSize: "11px", padding: "3px 6px", whiteSpace: "nowrap" }}
          >
            {POSITION_NEXT_LABEL[navPosition]}
          </button>

          {isVertical && (
            <button
              className="sidebarToggle publicSidebarToggle navCollapseBtn"
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
              title={collapsed ? "Expand navigation" : "Collapse navigation"}
            >
              {collapseLabel}
            </button>
          )}
        </div>
      </div>

      <div className="publicSidebarLinks">
        <ul className="navbar-nav">
          {filteredNavItems.map((item) => (
            <li key={item.to} className="nav-item">
              <NavLink to={item.to} className={navClass} end={item.end} title={item.label}>
                <span className="nav-full">{item.label}</span>
                <span className="nav-abbr">{item.abbr}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Search bar: bottom for left/right, right for top/bottom */}
        <div className="sidebarSearchBox">
          <input
            type="text"
            className="sidebarSearchInput"
            placeholder="🔍 Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

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
