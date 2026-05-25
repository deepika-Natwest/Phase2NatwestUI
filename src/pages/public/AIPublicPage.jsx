import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import defaultImg from "../../assets/img/user-avatar.png";
import { getPublicDeliverables } from "../../features/deliverables/publicDeliverableService";

/* -----------------------------------------
   Helper to show AI deliverable value
------------------------------------------ */
const getAIDisplayValue = (item) => {
  if (item.category === "Cost Saving" && item.costSavingAmount) {
    return `💰 ${item.costSavingCurrency || "₹"} ${item.costSavingAmount}`;
  }

  if (item.category === "Process Improvement") {
    if (item.timeHours || item.timeMinutes) {
      return `⏱ ${item.timeHours || 0}h ${item.timeMinutes || 0}m`;
    }
  }

  if (item.category === "New Functionality" && item.newFunctionality) {
    return `⚙️ ${item.newFunctionality}`;
  }

  return null;
};

function DeliverableAIPublicPage() {
  const [deliverables, setDeliverables] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [category, setCategory] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getPublicDeliverables();
        const aiData = res.data.filter((d) => d.aiBased === true);

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

  /* ✅ Filtering */
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

    if (category) {
      temp = temp.filter((d) => d.category === category);
    }

    setFiltered(temp);
  }, [month, year, category, deliverables]);

  const years = Array.from(
    new Set(deliverables.map((d) => new Date(d.createdAt).getFullYear()))
  ).sort((a, b) => b - a);

  const categories = Array.from(
    new Set(deliverables.map((d) => d.category).filter(Boolean))
  ).sort();

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <>
      <Header />

      {/* Heading */}
      <div className="recog-detailed-heading p-3 mb-5">
        <div className="container">
          <div className="row align-items-center">

            <div className="col-6 d-flex">
              <span className="recog-main-side-line trophy-emoji" >🤖</span>
              <span className="recog-main-title">AI Artifacts</span>
            </div>

            {/* Month */}
            <div className="col-2">
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

            {/* Year */}
            <div className="col-2">
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

            {/* Category */}
            <div className="col-2">
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
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
          <div className="text-center mt-5">
            No AI deliverables found.
          </div>
        ) : (
          <div className="row">
            {filtered.map((item) => {
              const isExpanded = expandedId === item.id;

              return (
                <div key={item.id} className="col-md-4 mb-4">
                  <div
                    className={`recog-card h-100 ${isExpanded ? "expanded" : ""}`}
                    onClick={() => toggleExpand(item.id)}
                    style={{ cursor: "pointer" }}
                  >

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
                      {/* ✅ Category */}
                      <span className="recog-badge">
                        🤖 {item.category || "AI Work"}
                      </span>

                      {/* ✅ VALUE BELOW CATEGORY */}
                      {getAIDisplayValue(item) && (
                        <div className="fw-bold text-success mt-1">
                          {getAIDisplayValue(item)}
                        </div>
                      )}

                      {/* ✅ Title */}
                      <h6 className="recog-card-name mt-2">
                        {item.deliveryTitle}
                      </h6>

                      {/* ✅ Description */}
                      <p className="recog-card-message mt-2">
                        {isExpanded
                          ? item.description
                          : `${item.description?.slice(0, 140)}...`}
                      </p>

                      {/* ✅ Project */}
                      <div className="recog-card-dept mt-2">
                        {item.projectName || "AI Team"}
                      </div>
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

export default DeliverableAIPublicPage;
