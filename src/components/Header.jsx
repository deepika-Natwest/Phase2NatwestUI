// src/components/Header.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getImageUrl } from "../services/imageHelper";
import api from "../services/api";
import "../assets/styles/custom.css";

const NAV_ITEMS = [
  { to: "/dashboard",       label: "Dashboard",   end: true },
  { to: "/pricing",         label: "SOW",          end: true },
  { to: "/deliverables",    label: "Deliverables", end: true },
  { to: "/deliverables/ai", label: "AI"                      },
  { to: "/teams/table",     label: "Teams"                   },
  { to: "/program",         label: "Program"                 },
  { to: "/leaderships",     label: "Leadership"              },
  { to: "/events",          label: "Events"                  },
  { to: "/recognitions",    label: "Recognitions"            },
];

const TYPE_COLORS = {
  "Team Member": "#0d6efd",
  Program:       "#198754",
  Event:         "#fd7e14",
  Recognition:   "#6f42c1",
  Leadership:    "#0dcaf0",
  Deliverable:   "#20c997",
  AI:            "#e83e8c",
};

const SEARCH_MIN = 220; // minimum px reserved for the search box

function Header() {
  const navigate  = useNavigate();
  const username  = localStorage.getItem("username");

  /* ── Search state ── */
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState([]);
  const [allData, setAllData] = useState(null);
  const [focused, setFocused] = useState(false);
  const searchRef = useRef(null);

  /* ── Overflow nav state ── */
  const [overflowFrom, setOverflowFrom] = useState(NAV_ITEMS.length);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const itemWidths  = useRef([]);
  const itemRefs    = useRef([]);
  const collapseRef = useRef(null);
  const rightRef    = useRef(null);   // username div only
  const moreRef     = useRef(null);

  /* ══ Overflow calculation ══ */
  const recalculate = useCallback(() => {
    if (!collapseRef.current || itemWidths.current.length === 0) return;

    const collapseWidth = collapseRef.current.offsetWidth;
    const rightWidth    = rightRef.current?.offsetWidth || 160;
    const moreWidth     = moreRef.current?.offsetWidth  || 88;
    const gap           = 24;

    const available = collapseWidth - SEARCH_MIN - rightWidth - gap;

    let total   = 0;
    let splitAt = NAV_ITEMS.length;

    for (let i = 0; i < NAV_ITEMS.length; i++) {
      const w    = itemWidths.current[i] || 0;
      const need = i < NAV_ITEMS.length - 1 ? total + w + moreWidth : total + w;
      if (need > available) { splitAt = i; break; }
      total += w;
    }

    setOverflowFrom(splitAt);
  }, []);

  useEffect(() => {
    const measureAndCalc = () => {
      itemWidths.current = itemRefs.current.map(
        (el) => (el ? el.getBoundingClientRect().width : 0)
      );
      recalculate();
    };
    const raf = requestAnimationFrame(measureAndCalc);
    window.addEventListener("resize", recalculate);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", recalculate); };
  }, [recalculate]);

  /* Close "More" on outside click */
  useEffect(() => {
    const onOutside = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setShowMoreMenu(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  /* ══ Search helpers ══ */
  const loadSearchData = async () => {
    if (allData) return;
    try {
      const [usersRes, programsRes, eventsRes, recogRes, leadRes, delivRes] = await Promise.all([
        api.get("/users"), api.get("/programs"), api.get("/events"),
        api.get("/recognition"), api.get("/leadership"), api.get("/deliverables"),
      ]);
      const users = (usersRes.data?.users || usersRes.data?.data || usersRes.data || [])
        .filter((u) => u.role?.toUpperCase() !== "ADMIN");
      setAllData({
        users,
        programs:     Array.isArray(programsRes.data)  ? programsRes.data  : [],
        events:       Array.isArray(eventsRes.data)    ? eventsRes.data    : [],
        recognitions: Array.isArray(recogRes.data)     ? recogRes.data     : [],
        leadership:   Array.isArray(leadRes.data)      ? leadRes.data      : [],
        deliverables: Array.isArray(delivRes.data)     ? delivRes.data     : [],
      });
    } catch (err) { console.error("Search load failed:", err); }
  };

  // Pre-load search data on mount so results are instant on first keystroke
  useEffect(() => { loadSearchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const match = (val, q) => val && String(val).toLowerCase().includes(q);

  useEffect(() => {
    if (!query.trim() || !allData) { setResults([]); return; }
    const q = query.toLowerCase();

    const grouped = {};
    const add = (type, label, sub, path, state) => {
      if (!label) return;
      if (!grouped[type]) grouped[type] = [];
      if (grouped[type].length < 5)
        grouped[type].push({ type, label, sub: sub || "", path, state });
    };

    // Team Members — name, enterprise ID, project, level, location, line manager
    allData.users.forEach((u) => {
      if (match(u.name, q) || match(u.enterpriseId, q) || match(u.projectName, q) ||
          match(u.careerLevel, q) || match(u.location, q) || match(u.lineManager, q))
        add("Team Member", u.name,
          [u.projectName, u.careerLevel, u.location].filter(Boolean).join(" · "),
          "/teams/table");
    });

    // Programs — name, description
    allData.programs.forEach((p) => {
      if (match(p.name, q) || match(p.description, q))
        add("Program", p.name,
          p.description ? p.description.slice(0, 70) + "…" : "",
          "/program", { highlightProgram: p.name });
    });

    // Events — eventName, description, location, tag, status
    allData.events.forEach((e) => {
      if (match(e.eventName, q) || match(e.description, q) ||
          match(e.location, q) || match(e.tag, q) || match(e.status, q))
        add("Event", e.eventName,
          [e.location, e.date].filter(Boolean).join(" · "),
          "/events");
    });

    // Recognitions — name, designation, type, tag, shortDescription, location
    allData.recognitions.forEach((r) => {
      if (match(r.name, q) || match(r.designation, q) || match(r.recognitionType, q) ||
          match(r.recognitionTag, q) || match(r.shortDescription, q) || match(r.location, q))
        add("Recognition", r.name,
          [r.designation, r.recognitionType].filter(Boolean).join(" · "),
          "/recognitions");
    });

    // Leadership — name, designation, managementLevel, shortDescription, location
    allData.leadership.forEach((l) => {
      if (match(l.name, q) || match(l.designation, q) || match(l.managementLevel, q) ||
          match(l.shortDescription, q) || match(l.location, q))
        add("Leadership", l.name,
          [l.designation, l.managementLevel].filter(Boolean).join(" · "),
          "/leaderships");
    });

    // Deliverables & AI — deliveryTitle, projectName, description, category, newFunctionality
    (allData.deliverables || []).forEach((d) => {
      if (match(d.deliveryTitle, q) || match(d.projectName, q) ||
          match(d.description, q) || match(d.category, q) || match(d.newFunctionality, q)) {
        const isAI = d.aiBased === true;
        add(
          isAI ? "AI" : "Deliverable",
          d.deliveryTitle || d.projectName,
          [d.projectName, d.category].filter(Boolean).join(" · "),
          isAI ? "/deliverables/ai" : "/deliverables"
        );
      }
    });

    // Flatten grouped results in a fixed category order
    const ORDER = ["Team Member", "Program", "Deliverable", "AI", "Event", "Recognition", "Leadership"];
    const flat = ORDER.flatMap((type) => grouped[type] || []);
    setResults(flat);
  }, [query, allData]);

  /* Close search on outside click */
  useEffect(() => {
    const onOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setQuery(""); setResults([]); setFocused(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const handleResultClick = (r) => {
    navigate(r.path, r.state ? { state: r.state } : undefined);
    setQuery(""); setResults([]); setFocused(false);
  };

  const handleLogout = () => { localStorage.clear(); navigate("/"); };
  const navClass = ({ isActive }) => (isActive ? "nav-link active" : "nav-link");
  const hasOverflow = overflowFrom < NAV_ITEMS.length;

  return (
    <nav className="navbar navbar-expand-lg navbar-light headerBox">
      <div className="container-fluid px-3">

        <NavLink className="navbar-brand py-0" to="/" end>
          <img src={getImageUrl("siteLogo.png")} alt="Natwest" style={{ height: "36px" }} />
        </NavLink>

        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* ── Collapse section (flex row: nav | search | username) ── */}
        <div className="collapse navbar-collapse" id="navbarNav" ref={collapseRef}
             style={{ display: "flex", alignItems: "center" }}>

          {/* Nav tabs — fixed width, no shrink/grow */}
          <ul className="navbar-nav align-items-center flex-nowrap mb-0"
              style={{ flexShrink: 0, gap: "2px" }}>

            {NAV_ITEMS.map((item, i) => (
              <li
                key={item.to}
                className="nav-item"
                ref={(el) => (itemRefs.current[i] = el)}
                style={{ display: i < overflowFrom ? "block" : "none" }}
              >
                <NavLink to={item.to} className={navClass} end={item.end}>
                  {item.label}
                </NavLink>
              </li>
            ))}

            {/* More ▾ — always in DOM so its width can be measured */}
            <li className="nav-item" ref={moreRef}
                style={{ display: hasOverflow ? "block" : "none", position: "relative" }}>
              <button
                className="nav-link"
                onClick={() => setShowMoreMenu((p) => !p)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: showMoreMenu ? "#fff" : "#ad79d1",
                  fontWeight: 600, fontSize: "1.1rem", padding: "1rem 1.5rem",
                  whiteSpace: "nowrap",
                }}
              >
                More ▾
              </button>

              {showMoreMenu && (
                <div style={{
                  position: "absolute", top: "100%", left: 0,
                  minWidth: "160px", background: "#fff",
                  border: "1px solid #ddd", borderRadius: "6px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                  zIndex: 9999, overflow: "hidden",
                }}>
                  {NAV_ITEMS.slice(overflowFrom).map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setShowMoreMenu(false)}
                      style={({ isActive }) => ({
                        display: "block", padding: "9px 16px", fontSize: "0.9rem",
                        fontWeight: 600, textDecoration: "none",
                        color: isActive ? "#5a287d" : "#333",
                        background: isActive ? "#f3ecfa" : "transparent",
                        borderBottom: "1px solid #f0f0f0",
                      })}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#f8f0ff"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </li>
          </ul>

          {/* Search — flex:1 fills all remaining space between tabs and username */}
          <div ref={searchRef}
               style={{ flex: 1, minWidth: `${SEARCH_MIN}px`, maxWidth: "560px", margin: "0 14px", position: "relative" }}>

            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)",
                color: "#bbb", fontSize: "14px", pointerEvents: "none", zIndex: 1,
              }}>
                🔍
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search people, programs, events…"
                value={query}
                style={{ borderRadius: "20px", paddingLeft: "34px", height: "36px", fontSize: "0.93rem", width: "100%" }}
                onFocus={() => { setFocused(true); loadSearchData(); }}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {focused && query.trim() && (
              <div style={{
                position: "absolute", top: "42px", left: 0,
                width: "100%", minWidth: "320px",
                background: "#fff", border: "1px solid #ddd", borderRadius: "8px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                zIndex: 9999, maxHeight: "420px", overflowY: "auto",
              }}>
                {results.length === 0 ? (
                  <div style={{ padding: "16px", color: "#888", fontSize: "13px", textAlign: "center" }}>
                    No results found for &ldquo;{query}&rdquo;
                  </div>
                ) : (() => {
                  // Group by type for section headers
                  const sections = [];
                  let lastType = null;
                  results.forEach((r, i) => {
                    if (r.type !== lastType) {
                      sections.push({ kind: "header", type: r.type });
                      lastType = r.type;
                    }
                    sections.push({ kind: "item", r, i });
                  });
                  return sections.map((s, si) =>
                    s.kind === "header" ? (
                      <div key={`hdr-${s.type}`} style={{
                        padding: "6px 14px 4px",
                        fontSize: "10px", fontWeight: 700, letterSpacing: "0.8px",
                        color: "#fff", background: TYPE_COLORS[s.type] || "#6c757d",
                        textTransform: "uppercase",
                      }}>
                        {s.type}
                      </div>
                    ) : (
                      <div
                        key={`item-${s.i}`}
                        onClick={() => handleResultClick(s.r)}
                        style={{
                          padding: "9px 14px", cursor: "pointer",
                          borderBottom: "1px solid #f5f5f5",
                          display: "flex", flexDirection: "column", gap: "2px",
                          background: "#fff",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#f8f4ff"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
                      >
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#222" }}>
                          {s.r.label}
                        </span>
                        {s.r.sub && (
                          <span style={{ fontSize: "11px", color: "#888" }}>
                            {s.r.sub}
                          </span>
                        )}
                      </div>
                    )
                  );
                })()}
              </div>
            )}
          </div>

          {/* Username + Logout — fixed, no shrink */}
          <div ref={rightRef} style={{ flexShrink: 0 }}>
            {username && (
              <span className="navbar-text" style={{ whiteSpace: "nowrap" }}>
                {username}
                <button className="btn btn-sm btn-outline-secondary ms-2" onClick={handleLogout}>
                  Logout
                </button>
              </span>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}

export default Header;
