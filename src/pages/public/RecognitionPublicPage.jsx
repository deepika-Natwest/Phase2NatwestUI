import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import maleImg from "../../assets/img/maleAvtaar.png";
import femaleImg from "../../assets/img/femaleAvatar.png";
import defaultImg from "../../assets/img/user-avatar.png";
import { getPublicRecognitions } from "../../features/recognition/publicRecognitionService";

function RecognitionPublicPage() {
  const [recognitions, setRecognitions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const genderImages = {
    male: maleImg,
    female: femaleImg,
  };

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
    {
      id: 1,
      name: "Aditi Sharma",
      genderType: "female",
      recognitionType: "Birthday",
      recognitionTag: "Application Developer",
      shortDescription:
        "Wishing you a very happy birthday filled with happiness, success, and wonderful moments.",
      date: "24 Jul",
    },
    {
      id: 2,
      name: "Rahul Verma",
      genderType: "male",
      recognitionType: "Birthday",
      recognitionTag: "Business Analyst",
      shortDescription:
        "Warm birthday wishes for a fantastic year ahead filled with growth and achievements.",
      date: "28 Jul",
    },
    {
      id: 3,
      name: "Priya Singh",
      genderType: "female",
      recognitionType: "Birthday",
      recognitionTag: "Project Manager",
      shortDescription:
        "Celebrating your special day and wishing you continued success and happiness.",
      date: "31 Jul",
    },
  ];

  const milestones = [
    {
      id: 1,
      name: "Aman Gupta",
      genderType: "male",
      recognitionType: "3 Years",
      recognitionTag: "Software Engineer",
      shortDescription:
        "Congratulations on completing 3 successful years of dedication, contribution, and excellence.",
    },
    {
      id: 2,
      name: "Sneha Kapoor",
      genderType: "female",
      recognitionType: "5 Years",
      recognitionTag: "Team Lead",
      shortDescription:
        "Celebrating 5 remarkable years of commitment, leadership, and valuable contributions.",
    },
    {
      id: 3,
      name: "Rohit Mehta",
      genderType: "male",
      recognitionType: "10 Years",
      recognitionTag: "Senior Manager",
      shortDescription:
        "Congratulations on achieving 10 years of outstanding service, consistency, and impact.",
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getPublicRecognitions();
        setRecognitions(res.data);
        setFiltered(res.data);
      } catch (err) {
        console.error("Failed to load recognitions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filters
  useEffect(() => {
    let temp = [...recognitions];

    if (month) {
      temp = temp.filter(
        (r) => new Date(r.createdAt).getMonth() + 1 === parseInt(month)
      );
    }

    if (year) {
      temp = temp.filter(
        (r) => new Date(r.createdAt).getFullYear() === parseInt(year)
      );
    }

    setFiltered(temp);
  }, [month, year, recognitions]);

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
          <div className="row w100">
            <div className="col-8 d-flex">
              <span className="recog-main-side-line">
                <span className="trophy-emoji" role="img" aria-label="trophy">🏆</span>
              </span>
              <span className="recog-main-title">Recognitions</span>
            </div>

            <div className="col-2 mt-3">
              <select
                className="form-select"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              >
                <option value="">All Months</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString("default", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-2 mt-3">
              <select
                className="form-select"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                <option value="">All Years</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Recognition Cards */}
      <div className="container">
        {loading ? (
          <div className="text-center mt-5">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center mt-5">No recognitions found.</div>
        ) : (
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
        )}
      </div>

    
      {/* Employee Birthday Cards */}
      <div className="container">
        <div className="row">
          {birthdays.map((emp) => {
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

      

      {/* Personal Milestone Cards */}
      <div className="container mb-5">
        <div className="row">
          {milestones.map((emp) => {
            const milestoneId = `milestone-${emp.id}`;
            const isExpanded = expandedId === milestoneId;

            return (
              <div key={milestoneId} className="col-md-4 mb-4">
                <div
                  className={`recog-card h-100 ${
                    isExpanded ? "expanded" : ""
                  }`}
                  onClick={() => toggleExpand(milestoneId)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="recog-img-wrap">
                   
                  </div>

                  <div className="recog-card-content">
                    <div className="recog-card-title-row">
                      <span className="recog-card-name">{emp.name}</span>

                      <span className="recog-badge star-performer">
                        <span className="recog-badge-icon">⭐</span>
                        {emp.recognitionType}
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

      <Footer />
    </>
  );
}

export default RecognitionPublicPage;