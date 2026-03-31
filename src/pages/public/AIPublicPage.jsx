import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import defaultImg from "../../assets/img/user-avatar.png";

import { getPublicDeliverables } from "../../features/deliverables/publicDeliverableService";

function DeliverableAIPublicPage() {
  const [deliverables, setDeliverables] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getPublicDeliverables();

        // ✅ ONLY AI-based records
        const aiData = res.data.filter(
          (d) => d.aiBased === true
        );

        setDeliverables(aiData);
        setFiltered(aiData);
      } catch (err) {
        console.error("Failed to load AI deliverables:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filters (month/year)
  useEffect(() => {
    let temp = [...deliverables];

    if (month) {
      temp = temp.filter(
        (d) => new Date(d.createdAt).getMonth() + 1 === parseInt(month)
      );
    }

    if (year) {
      temp = temp.filter(
        (d) => new Date(d.createdAt).getFullYear() === parseInt(year)
      );
    }

    setFiltered(temp);
  }, [month, year, deliverables]);

  const years = Array.from(
    new Set(deliverables.map((d) => new Date(d.createdAt).getFullYear()))
  ).sort((a, b) => b - a);

  return (
    <>
      <Header />

      {/* Heading */}
      <div className="recog-detailed-heading p-3 mb-5">
        <div className="container">
          <div className="row w100">
            <div className="col-8 d-flex">
              <span className="recog-main-side-line">🤖</span>
              <span className="recog-main-title">
                AI DELIVERABLES SHOWCASE
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
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container">
        {loading ? (
          <div className="text-center mt-5">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center mt-5">
            No AI deliverables found.
          </div>
        ) : (
          <div className="row">
            {filtered.map((item) => (
              <div key={item.id} className="col-md-4 mb-4">
                <div className="recog-card">

                  {item.file && (
                    <div className="recog-img-wrap">
                      <img
                        src={defaultImg}
                        className="card-img-top"
                        alt="deliverable"
                      />
                    </div>
                  )}

                  <div className="recog-card-content">
                    <div className="recog-card-title-row">
                            {/* ✅ AI badge */}
                      <span className="recog-badge">
                        🤖    {item.category || "AI Work"}
                      </span>
                      <span className="recog-card-name">
                        {item.deliveryTitle}
                      </span>

                
                    </div>


                    <span className="recog-card-message">
                      {item.description}
                    </span>

                    <span className="recog-card-dept">
                      {item.projectName || "AI Team"}
                    </span>

                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}

export default DeliverableAIPublicPage;