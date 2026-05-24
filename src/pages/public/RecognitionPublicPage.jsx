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
  };

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
                <span role="img" aria-label="trophy">🏆</span>
              </span>
              <span className="recog-main-title">
                Excellence Gallery
              </span>
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
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Cards */}
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
                    className={`recog-card h-100 ${isExpanded ? "expanded" : ""}`}
                    onClick={() => toggleExpand(recog.id)}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Avatar */}
                    {recog.pic && (
                      <div className="recog-img-wrap">
                        <img
                          src={
                            genderImages[
                              recog.genderType?.trim().toLowerCase()
                            ] || defaultImg
                          }
                          className="card-img-top"
                          alt={recog.name}
                        />
                      </div>
                    )}

                    <div className="recog-card-content">
                      <div className="recog-card-title-row">
                        <span className="recog-card-name">
                          {recog.name}
                        </span>

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

      <Footer />
    </>
  );
}

export default RecognitionPublicPage;