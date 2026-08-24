// src/components/Header.jsx
import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { NavLink, useNavigate } from "react-router-dom";
import { getImageUrl } from "../services/imageHelper";
import api from "../services/api";
import "../assets/styles/custom.css";

const POSITIONS = ["left", "top", "right", "bottom"];

const NAV_ITEMS = [
  { to: "/dashboard",    label: "Dashboard",    abbr: "Db", end: true },
  { to: "/pricing",      label: "SOW",          abbr: "SW", end: true },
  { to: "/deliverables", label: "Deliverables", abbr: "Dl", end: true },
  { to: "/deliverables/ai", label: "AI",        abbr: "AI" },
  { to: "/teams/table",  label: "Teams",        abbr: "Tm" },
  { to: "/program",      label: "Program",      abbr: "Pr" },
  { to: "/leaderships",  label: "Leadership",   abbr: "Ld" },
  { to: "/events",       label: "Events",       abbr: "Ev" },
  { to: "/recognitions", label: "Recognitions", abbr: "Rg" },
];

// Per-type theme: primary color + soft background tint
const TYPE_THEME = {
  Team:        { color: "#1a56db", bg: "#eff6ff", icon: "👥" },
  Program:     { color: "#059669", bg: "#ecfdf5", icon: "🗂️" },
  Event:       { color: "#d97706", bg: "#fffbeb", icon: "📅" },
  Recognition: { color: "#7c3aed", bg: "#f5f3ff", icon: "🏆" },
  Deliverable: { color: "#0891b2", bg: "#ecfeff", icon: "🚀" },
  Leadership:  { color: "#e11d48", bg: "#fff1f2", icon: "⭐" },
};

function Header() {
  const navigate  = useNavigate();
  const username  = localStorage.getItem("username");

  const [navPosition, setNavPosition] = useState(
    () => localStorage.getItem("navPosition") || "left"
  );
  const [collapsed, setCollapsed]   = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragZone,   setDragZone]   = useState(null);
  const dragZoneRef = useRef(null);
  const navWrapRef    = useRef(null);
  const moreButtonRef = useRef(null);
  const moreDropRef   = useRef(null);
  const [visibleCount, setVisibleCount] = useState(NAV_ITEMS.length);
  const [moreOpen,     setMoreOpen]     = useState(false);
  const [moreDropPos,  setMoreDropPos]  = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // Cross-tab search data (loaded eagerly on mount)
  const [allData, setAllData] = useState({
    users: [], programs: [], events: [], recognitions: [], deliverables: [], leaderships: [],
  });

  const searchBoxRef  = useRef(null);
  const searchInputRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 320 });
  const isVertical   = navPosition === "left" || navPosition === "right";

  // ── Body classes ─────────────────────────────────────────────────────────
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

  // ── Compute dropdown position (stored as inline style object) ───────────
  useEffect(() => {
    if (showResults && searchInputRef.current) {
      const rect = searchInputRef.current.getBoundingClientRect();
      const sidebarW = collapsed ? 72 : 232;
      const vpH = window.innerHeight;
      const vpW = window.innerWidth;

      if (navPosition === "left") {
        // Open ABOVE the search bar, anchored to right of sidebar
        setDropdownPos({
          position: "fixed",
          bottom: vpH - rect.top + 6,
          left: sidebarW + 8,
          width: 340,
          zIndex: 99999,
        });
      } else if (navPosition === "right") {
        // Open ABOVE the search bar, anchored to left of sidebar
        setDropdownPos({
          position: "fixed",
          bottom: vpH - rect.top + 6,
          right: sidebarW + 8,
          width: 340,
          zIndex: 99999,
        });
      } else if (navPosition === "bottom") {
        // Open ABOVE the bottom navbar
        setDropdownPos({
          position: "fixed",
          bottom: vpH - rect.top + 6,
          left: rect.left,
          width: Math.max(320, rect.width),
          zIndex: 99999,
        });
      } else {
        // Top nav: open below the input
        setDropdownPos({
          position: "fixed",
          top: rect.bottom + 6,
          left: rect.left,
          width: Math.max(320, rect.width),
          zIndex: 99999,
        });
      }
    }
  }, [showResults, navPosition, collapsed]);

  // ── Close results on outside click ───────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Eager data load on mount ──────────────────────────────────────────────
  useEffect(() => {
    const toArr = (d, key) =>
      Array.isArray(d) ? d
      : (key && Array.isArray(d?.[key])) ? d[key]
      : Array.isArray(d?.data) ? d.data
      : [];

    const load = async () => {
      const [usersR, progsR, eventsR, recsR, delivsR, leadsR] = await Promise.allSettled([
        api.get("/users?limit=2000"),
        api.get("/programs"),
        api.get("/events"),
        api.get("/recognition"),
        api.get("/deliverables"),
        api.get("/leadership"),
      ]);

      const get = (r, key) => r.status === "fulfilled" ? toArr(r.value.data, key) : [];

      const loaded = {
        users:        get(usersR,  "users").filter((u) => u.role?.toUpperCase() !== "ADMIN"),
        programs:     get(progsR,  "programs"),
        events:       get(eventsR, "events"),
        recognitions: get(recsR,   "recognitions"),
        deliverables: get(delivsR, "deliverables"),
        leaderships:  get(leadsR,  "leaders"),
      };

      console.log("[GlobalSearch] loaded counts:", {
        users: loaded.users.length,
        programs: loaded.programs.length,
        events: loaded.events.length,
        recognitions: loaded.recognitions.length,
        deliverables: loaded.deliverables.length,
        leaderships: loaded.leaderships.length,
      });
      if (loaded.users[0]) console.log("[GlobalSearch] user sample:", loaded.users[0]);
      if (loaded.events[0]) console.log("[GlobalSearch] event sample:", loaded.events[0]);
      if (loaded.deliverables[0]) console.log("[GlobalSearch] deliverable sample:", loaded.deliverables[0]);

      setAllData(loaded);
    };

    load();
  }, []);

  // ── Cross-tab search ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    const q = searchQuery.toLowerCase();
    const results = [];
    console.log("[GlobalSearch] searching for:", q, "| data sizes:", allData.users.length, allData.programs.length, allData.events.length);

    const push = (type, label, sub, to) => {
      if (label) results.push({ type, label, sub: sub || "", to });
    };

    allData.users
      .filter((u) =>
        u.name?.toLowerCase().includes(q) ||
        u.enterpriseId?.toLowerCase().includes(q) ||
        u.projectName?.toLowerCase().includes(q) ||
        u.location?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .forEach((u) => push("Team", u.name, u.projectName || u.enterpriseId, "/teams/table"));

    allData.programs
      .filter((p) =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .forEach((p) => push("Program", p.name, p.description, `/program?highlight=${encodeURIComponent(p.name)}`));

    allData.events
      .filter((e) =>
        e.eventName?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .forEach((e) => push("Event", e.eventName, e.description, "/events"));

    allData.recognitions
      .filter((r) =>
        r.name?.toLowerCase().includes(q) ||
        r.recognitionType?.toLowerCase().includes(q) ||
        r.recognitionTag?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .forEach((r) => push("Recognition", r.name, r.recognitionType, "/recognitions"));

    allData.deliverables
      .filter((d) =>
        d.deliveryTitle?.toLowerCase().includes(q) ||
        d.category?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .forEach((d) => push("Deliverable", d.deliveryTitle, d.category, "/deliverables"));

    allData.leaderships
      .filter((l) =>
        l.name?.toLowerCase().includes(q) ||
        l.role?.toLowerCase().includes(q) ||
        l.title?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .forEach((l) => push("Leadership", l.name, l.role || l.title, "/leaderships"));

    setSearchResults(results.slice(0, 25));
    setShowResults(results.length > 0);
  }, [searchQuery, allData]);

  // ── Nav overflow: measure how many items fit in the nav wrap ─────────────
  useEffect(() => {
    if (!isVertical || collapsed) {
      setVisibleCount(NAV_ITEMS.length);
      return;
    }
    const el = navWrapRef.current;
    if (!el) return;
    const measure = () => {
      const firstItem = el.querySelector(".nav-item");
      const itemH = firstItem ? firstItem.offsetHeight + 4 : 44; // +4 for gap
      const raw = Math.floor(el.clientHeight / itemH);
      // If all items fit, no More button needed; otherwise reserve 1 slot for the More button itself
      const count = raw >= NAV_ITEMS.length ? NAV_ITEMS.length : Math.max(1, raw - 1);
      setVisibleCount(count);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, [isVertical, collapsed]);

  // Close "More" dropdown on outside click — exclude the dropdown portal itself
  useEffect(() => {
    if (!moreOpen) return;
    const h = (e) => {
      const inButton = moreButtonRef.current?.contains(e.target);
      const inDrop   = moreDropRef.current?.contains(e.target);
      if (!inButton && !inDrop) setMoreOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [moreOpen]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleLogout = () => { localStorage.clear(); navigate("/"); };

  const handleDragStart = (e) => {
    e.preventDefault();
    setIsDragging(true);

    const onMouseMove = (ev) => {
      const vpW = window.innerWidth;
      const vpH = window.innerHeight;
      const x = ev.clientX, y = ev.clientY;
      const nearest = [
        { pos: "left",   d: x },
        { pos: "right",  d: vpW - x },
        { pos: "top",    d: y },
        { pos: "bottom", d: vpH - y },
      ].sort((a, b) => a.d - b.d)[0].pos;
      dragZoneRef.current = nearest;
      setDragZone(nearest);
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      if (dragZoneRef.current) {
        setNavPosition(dragZoneRef.current);
        localStorage.setItem("navPosition", dragZoneRef.current);
      }
      setIsDragging(false);
      setDragZone(null);
      dragZoneRef.current = null;
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const handleMoreClick = () => {
    if (!moreButtonRef.current) return;
    const rect = moreButtonRef.current.getBoundingClientRect();
    const sidebarW = collapsed ? 72 : 232;
    const vpH = window.innerHeight;
    let pos = { position: "fixed", zIndex: 99998, minWidth: 190 };
    if (navPosition === "left")        pos = { ...pos, top: rect.top, left: sidebarW + 6 };
    else if (navPosition === "right")  pos = { ...pos, top: rect.top, right: sidebarW + 6 };
    else if (navPosition === "top")    pos = { ...pos, top: rect.bottom + 6, left: rect.left };
    else                               pos = { ...pos, bottom: vpH - rect.top + 6, left: rect.left };
    setMoreDropPos(pos);
    setMoreOpen((v) => !v);
  };

  const handleResultClick = (to) => {
    setSearchQuery("");
    setShowResults(false);
    navigate(to);
  };

  const navClass = ({ isActive }) => (isActive ? "nav-link active" : "nav-link");

  const collapseLabel =
    navPosition === "right"
      ? collapsed ? "<" : ">"
      : collapsed ? ">" : "<";

  const visibleItems  = NAV_ITEMS.slice(0, visibleCount);
  const overflowItems = NAV_ITEMS.slice(visibleCount);

  return (
    <nav
      className={`navbar navbar-light headerBox publicSidebar${
        isVertical && collapsed ? " collapsed" : ""
      }`}
    >
      {/* Logo + collapse button */}
      <div className="publicSidebarTop">
        <NavLink className="navbar-brand" to="/" end>
          <img src={getImageUrl("siteLogo.png")} alt="Natwest" />
        </NavLink>

        <div className="d-flex gap-1 align-items-center">
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

      {/* Nav links + position button + global search */}
      <div className="publicSidebarLinks">
        {/* Nav wrap — flex:1 so it takes remaining space; ResizeObserver watches this */}
        <div ref={navWrapRef} style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
          <ul className="navbar-nav">
            {visibleItems.map((item) => (
              <li key={item.to} className="nav-item">
                <NavLink to={item.to} className={navClass} end={item.end} title={item.label}>
                  <span className="nav-full">{item.label}</span>
                  <span className="nav-abbr">{item.abbr}</span>
                </NavLink>
              </li>
            ))}
            {overflowItems.length > 0 && (
              <li className="nav-item">
                <button
                  ref={moreButtonRef}
                  className="nav-link"
                  style={{ width: "100%", textAlign: "left", background: moreOpen ? "rgba(255,255,255,0.12)" : "none", border: "none", cursor: "pointer" }}
                  onClick={handleMoreClick}
                  title="More navigation items"
                >
                  <span className="nav-full">More ▾ ({overflowItems.length})</span>
                  <span className="nav-abbr">•••</span>
                </button>
              </li>
            )}
          </ul>
        </div>

        {/* "More" overflow dropdown — portal into body */}
        {moreOpen && overflowItems.length > 0 && ReactDOM.createPortal(
          <div ref={moreDropRef} style={{
            ...moreDropPos,
            background: "linear-gradient(160deg, #3a0f58, #5a287d)",
            borderRadius: 12,
            padding: "6px 0",
            boxShadow: "0 8px 32px rgba(60,0,100,0.35), 0 2px 8px rgba(0,0,0,0.2)",
          }}>
            {overflowItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={navClass}
                end={item.end}
                onClick={() => setMoreOpen(false)}
                style={({ isActive }) => ({
                  display: "block",
                  padding: "10px 20px",
                  color: isActive ? "#fff" : "#d4a8ef",
                  background: isActive ? "linear-gradient(120deg, #42145f, #e6007e)" : undefined,
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  borderLeft: isActive ? "3px solid #e6007e" : "3px solid transparent",
                })}
              >
                {item.label}
              </NavLink>
            ))}
          </div>,
          document.body
        )}

        {/* Global search bar */}
        <div className="sidebarSearchBox" ref={searchBoxRef}>
          <input
            ref={searchInputRef}
            type="text"
            className="sidebarSearchInput"
            placeholder="🔍 Search all..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") { setSearchQuery(""); setShowResults(false); } }}
          />

          {/* Results dropdown — rendered via portal into document.body so no parent overflow:hidden can clip it */}
          {showResults && searchResults.length > 0 && ReactDOM.createPortal(
            <div className="sidebarSearchResults" style={dropdownPos}>
              <div className="sidebarSearchResultsHeader">
                {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for &nbsp;<strong>"{searchQuery}"</strong>
              </div>
              {(() => {
                const types = [...new Set(searchResults.map((r) => r.type))];
                return types.map((type) => {
                  const theme = TYPE_THEME[type] || { color: "#6c757d", bg: "#f8f9fa", icon: "•" };
                  return (
                    <div key={type}>
                      <div
                        className="sidebarSearchResultGroup"
                        style={{ borderLeft: `3px solid ${theme.color}`, color: theme.color, background: theme.bg }}
                      >
                        {theme.icon} {type}
                      </div>
                      {searchResults
                        .filter((r) => r.type === type)
                        .map((r, i) => (
                          <div
                            key={i}
                            className="sidebarSearchResultItem"
                            style={{ borderLeft: `3px solid ${theme.color}` }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = theme.bg; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
                            onClick={() => handleResultClick(r.to)}
                          >
                            <span className="sidebarSearchResultLabel">{r.label}</span>
                            {r.sub && <span className="sidebarSearchResultSub">{r.sub}</span>}
                          </div>
                        ))}
                    </div>
                  );
                });
              })()}
              <div
                className="sidebarSearchResultsClear"
                onClick={() => { setSearchQuery(""); setShowResults(false); }}
              >
                ✕ Clear search
              </div>
            </div>,
            document.body
          )}
        </div>

        {/* Drag handle to reposition sidebar */}
        <div className="sidebarNavPosBox">
          <div
            className="sidebarDragHandle"
            onMouseDown={handleDragStart}
            title="Drag to move sidebar to any edge"
          >
            ⠿ ⠿ ⠿
          </div>
        </div>

        {/* Snap zone overlays — rendered into body so they cover the full viewport */}
        {isDragging && ReactDOM.createPortal(
          <>
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 99990, pointerEvents: "none" }} />
            {["top", "bottom", "left", "right"].map((zone) => {
              const isActive = dragZone === zone;
              const base = { position: "fixed", zIndex: 99991, background: isActive ? "rgba(108,99,255,0.55)" : "rgba(108,99,255,0.18)", border: `2px solid ${isActive ? "#6c63ff" : "rgba(108,99,255,0.4)"}`, borderRadius: 12, transition: "background 0.15s", pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 };
              const pos =
                zone === "top"    ? { top: 12, left: "50%", transform: "translateX(-50%)", width: 200, height: 48 }
                : zone === "bottom" ? { bottom: 12, left: "50%", transform: "translateX(-50%)", width: 200, height: 48 }
                : zone === "left"   ? { left: 12, top: "50%", transform: "translateY(-50%)", width: 48, height: 140 }
                :                     { right: 12, top: "50%", transform: "translateY(-50%)", width: 48, height: 140 };
              return (
                <div key={zone} style={{ ...base, ...pos }}>
                  {isActive ? "✓" : ""} {zone}
                </div>
              );
            })}
          </>,
          document.body
        )}

        {username && (
          <span className="navbar-text publicSidebarUser">
            {username}
            <button className="btn btn-sm btn-outline-secondary ms-2" onClick={handleLogout}>
              Logout
            </button>
          </span>
        )}
      </div>
    </nav>
  );
}

export default Header;
