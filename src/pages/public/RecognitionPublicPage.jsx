import React, { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import api from "../../services/api";
import { getPublicRecognitions } from "../../features/recognition/publicRecognitionService";

// Parse abbreviated month name from strings like "24 Jul" → 7
const MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const parseDateStrMonth = (dateStr) => {
  if (!dateStr) return null;
  const parts = String(dateStr).trim().split(" ");
  const idx = MONTH_ABBR.indexOf(parts[1]);
  return idx >= 0 ? idx + 1 : null;
};

const MILESTONE_YEARS = [3, 5, 10];

function RecognitionPublicPage() {
  const [recognitions, setRecognitions] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const BADGE_ICONS = {
    "Star Performer": "⭐",
    "Employee of the Month": "🎗️",
    "Client Recognized": "👏",
    Birthday: "🎂",
    "3 Years": "🌟",
    "5 Years": "🌟",
    "10 Years": "🌟",
  };

  const birthdays = [
    { id: 1, name: "Aditi Sharma", genderType: "female", recognitionType: "Birthday", recognitionTag: "Application Developer", shortDescription: "Wishing you a very happy birthday filled with happiness, success, and wonderful moments.", date: "24 Jul" },
    { id: 2, name: "Rahul Verma",  genderType: "male",   recognitionType: "Birthday", recognitionTag: "Business Analyst",       shortDescription: "Warm birthday wishes for a fantastic year ahead filled with growth and achievements.",    date: "28 Jul" },
    { id: 3, name: "Priya Singh",  genderType: "female", recognitionType: "Birthday", recognitionTag: "Project Manager",        shortDescription: "Celebrating your special day and wishing you continued success and happiness.",           date: "31 Jul" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recRes, usersRes] = await Promise.all([
          getPublicRecognitions(),
          api.get("/users"),
        ]);
        setRecognitions(recRes.data);
        const userList = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.users || [];
        setAllUsers(userList.filter((u) => (u.role || "").toUpperCase() !== "ADMIN"));
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const monthNum  = month ? parseInt(month)  : null;
  const yearNum   = year  ? parseInt(year)   : null;
  const thisYear  = new Date().getFullYear();

  // ── Client Appreciation (backend recognitions) ─────────────────────────────
  const filtered = useMemo(() => {
    return recognitions.filter((r) => {
      const d = new Date(r.createdAt);
      if (monthNum && d.getMonth() + 1 !== monthNum) return false;
      if (yearNum  && d.getFullYear()   !== yearNum)  return false;
      return true;
    });
  }, [recognitions, monthNum, yearNum]);

  // ── Birthdays (filter by parsed month from "24 Jul" date string) ────────────
  const filteredBirthdays = useMemo(() => {
    if (!monthNum) return birthdays;
    return birthdays.filter((b) => parseDateStrMonth(b.date) === monthNum);
  }, [monthNum]);

  // ── Career Milestones (computed live from natwestDoj) ───────────────────────
  const filteredMilestones = useMemo(() => {
    const targetYear = yearNum || thisYear;
    return allUsers
      .filter((u) => u.natwestDoj)
      .flatMap((u) => {
        const doj = new Date(String(u.natwestDoj).slice(0, 10) + "T00:00:00");
        if (isNaN(doj)) return [];
        return MILESTONE_YEARS
          .filter((n) => {
            const milestoneYear  = doj.getFullYear() + n;
            const milestoneMonth = doj.getMonth() + 1;
            if (milestoneYear !== targetYear) return false;
            if (monthNum && milestoneMonth !== monthNum) return false;
            return true;
          })
          .map((n) => ({
            id: `${u.id}-${n}`,
            name: u.name,
            genderType: (u.gender || "").toLowerCase(),
            recognitionType: `${n} Years`,
            recognitionTag: u.careerLevel || u.franchiseId || "Team Member",
            shortDescription: `Congratulations on completing ${n} year${n > 1 ? "s" : ""} of dedication and contribution at NatWest.`,
          }));
      });
  }, [allUsers, monthNum, yearNum, thisYear]);

  const years = Array.from(
    new Set(recognitions.map((r) => new Date(r.createdAt).getFullYear()))
  ).sort((a, b) => b - a);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <>
      <Header />

      {/* Header */}
      <div className="recog-detailed-heading p-3 mb-5">
        <div className="container">
          <div className="row w100 align-items-center">

            {/* Title — left */}
            <div className="col-6 d-flex align-items-center">
              <span className="recog-main-side-line trophy-emoji">🏆</span>
              <span className="recog-main-title ms-2">People Spotlight</span>
            </div>

            {/* Filters — right */}
            <div className="col-3 mt-3">
              <select
                className="form-select"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              >
                <option value="">All Months</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString("default", { month: "long" })}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-3 mt-3">
              <select
                className="form-select"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                <option value="">All Years</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

          </div>
        </div>
      </div>

      {loading && <div className="text-center mt-5">Loading...</div>}

      {/* Client Appreciation */}
      {!loading && filtered.length > 0 && (
      <div className="container mb-5">
        <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"20px" }}>
          <div style={{ background:"linear-gradient(135deg,#7c3aed,#a855f7)", borderRadius:"10px", padding:"10px 18px", display:"flex", alignItems:"center", gap:"8px" }}>
            <span style={{ fontSize:"22px" }}>👏</span>
            <span style={{ color:"#fff", fontWeight:700, fontSize:"16px", letterSpacing:"0.3px" }}>Client Appreciation</span>
          </div>
          <div style={{ flex:1, height:"2px", background:"linear-gradient(to right,#a855f7,transparent)" }} />
        </div>
          <div className="row">
            {filtered.map((recog) => {
              const isExpanded = expandedId === recog.id;

              return (
                <div key={recog.id} className="col-md-4 mb-4">
                  <div
                    className={`recog-card h-100 ${
                      isExpanded ? "expanded" : ""
                    }`}
                    onClick={() => toggleExpand(recog.id)}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Avatar */}
                    <div className="recog-img-wrap">
                     
                    </div>

                    <div className="recog-card-content">
                      <div className="recog-card-title-row">
                        <span className="recog-card-name">{recog.name}</span>

                        <span
                          className={
                            "recog-badge " +
                            recog.recognitionType
                              ?.toLowerCase()
                              .replace(/\s/g, "-")
                          }
                        >
                          <span className="recog-badge-icon">
                            {BADGE_ICONS[recog.recognitionType] || "🏅"}
                          </span>
                          {recog.recognitionType}
                        </span>
                      </div>

                      <span className="recog-card-message">
                        {isExpanded
                          ? recog.shortDescription
                          : `${recog.shortDescription?.slice(0, 120)}...`}
                      </span>

                      <span className="recog-card-dept">
                        {recog.recognitionTag}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
      </div>
      )}

      {/* Birthdays */}
      {filteredBirthdays.length > 0 && (
      <div className="container mb-5">
        <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"20px" }}>
          <div style={{ background:"linear-gradient(135deg,#db2777,#f472b6)", borderRadius:"10px", padding:"10px 18px", display:"flex", alignItems:"center", gap:"8px" }}>
            <span style={{ fontSize:"22px" }}>🎂</span>
            <span style={{ color:"#fff", fontWeight:700, fontSize:"16px", letterSpacing:"0.3px" }}>Birthdays</span>
          </div>
          <div style={{ flex:1, height:"2px", background:"linear-gradient(to right,#f472b6,transparent)" }} />
        </div>
        <div className="row">
          {filteredBirthdays.map((emp) => {
            const birthdayId = `birthday-${emp.id}`;
            const isExpanded = expandedId === birthdayId;

            return (
              <div key={birthdayId} className="col-md-4 mb-4">
                <div
                  className={`recog-card h-100 ${
                    isExpanded ? "expanded" : ""
                  }`}
                  onClick={() => toggleExpand(birthdayId)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="recog-img-wrap">
                  
                  </div>

                  <div className="recog-card-content">
                    <div className="recog-card-title-row">
                      <span className="recog-card-name">{emp.name}</span>

                      <span className="recog-badge employee-of-the-month">
                        <span className="recog-badge-icon">🎂</span>
                        {emp.date}
                      </span>
                    </div>

                    <span className="recog-card-message">
                      {isExpanded
                        ? emp.shortDescription
                        : `${emp.shortDescription?.slice(0, 120)}...`}
                    </span>

                    <span className="recog-card-dept">
                      {emp.recognitionTag}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Career Milestones — computed live from natwestDoj */}
      {filteredMilestones.length > 0 && (
      <div className="container mb-5">
        <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"20px" }}>
          <div style={{ background:"linear-gradient(135deg,#d97706,#fbbf24)", borderRadius:"10px", padding:"10px 18px", display:"flex", alignItems:"center", gap:"8px" }}>
            <span style={{ fontSize:"22px" }}>🌟</span>
            <span style={{ color:"#fff", fontWeight:700, fontSize:"16px", letterSpacing:"0.3px" }}>Career Milestones</span>
          </div>
          <div style={{ flex:1, height:"2px", background:"linear-gradient(to right,#fbbf24,transparent)" }} />
        </div>
        <div className="row">
          {filteredMilestones.map((emp) => {
            const milestoneId = `milestone-${emp.id}`;
            const isExpanded = expandedId === milestoneId;

            return (
              <div key={milestoneId} className="col-md-4 mb-4">
                <div
                  className={`recog-card h-100 ${isExpanded ? "expanded" : ""}`}
                  onClick={() => toggleExpand(milestoneId)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="recog-img-wrap"></div>

                  <div className="recog-card-content">
                    <div className="recog-card-title-row">
                      <span className="recog-card-name">{emp.name}</span>
                      <span className="recog-badge star-performer">
                        <span className="recog-badge-icon">⭐</span>
                        {emp.recognitionType}
                      </span>
                    </div>
                    <span className="recog-card-message">
                      {isExpanded ? emp.shortDescription : `${emp.shortDescription?.slice(0, 120)}...`}
                    </span>
                    <span className="recog-card-dept">{emp.recognitionTag}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      <Footer />
    </>
  );
}

export default RecognitionPublicPage;