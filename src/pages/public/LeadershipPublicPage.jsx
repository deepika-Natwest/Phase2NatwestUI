import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { getPublicLeadership } from "../../features/leadership/publicLeadershipService";

const MANAGEMENT_ORDER = [
  "Leadership Team",
  "Senior Delivery Leads",
  "Growth Team",
];

const SECTION_STYLES = {
  "Leadership Team":     { bg: "linear-gradient(135deg,#1d4ed8,#3b82f6)", line: "#3b82f6", emoji: "👑" },
  "Senior Delivery Leads": { bg: "linear-gradient(135deg,#065f46,#10b981)", line: "#10b981", emoji: "🚀" },
  "Growth Team":         { bg: "linear-gradient(135deg,#92400e,#f59e0b)", line: "#f59e0b", emoji: "📈" },
};

function LeadershipPublicPage() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getPublicLeadership();
        setLeaders(res.data || []);
      } catch (err) {
        console.error("Failed to load leadership:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Group leaders by management level
  const groupByManagementLevel = (leaders) => {
    return leaders.reduce((acc, leader) => {
      const level = leader.managementLevel || "Other";

      if (!acc[level]) {
        acc[level] = [];
      }

      acc[level].push(leader);
      return acc;
    }, {});
  };

  const groupedLeaders = groupByManagementLevel(leaders);

  return (
    <>
      <Header />

      {/* Page Header */}
      <div className="recog-detailed-heading p-3 mb-5">
        <div className="container">
          <div className="row w100">
            <div className="col-8 d-flex">
              <span className="recog-main-side-line ">
                <span className="trophy-emoji" role="img" aria-label="crown">👑</span>
              </span>
              <span className="recog-main-title">
                Executive Team
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container my-5">
        {loading ? (
          <div className="text-center mt-5">Loading...</div>
        ) : leaders.length === 0 ? (
          <div className="text-center mt-5">
            No leadership members found.
          </div>
        ) : (
          <>
            {MANAGEMENT_ORDER.map((level) => {
              if (!groupedLeaders[level]) return null;

              return (
                <div key={level} className="mb-5">
                  <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"20px" }}>
                    <div style={{ background: (SECTION_STYLES[level] || SECTION_STYLES["Leadership Team"]).bg, borderRadius:"10px", padding:"10px 18px", display:"flex", alignItems:"center", gap:"8px" }}>
                      <span style={{ fontSize:"22px" }}>{(SECTION_STYLES[level] || SECTION_STYLES["Leadership Team"]).emoji}</span>
                      <span style={{ color:"#fff", fontWeight:700, fontSize:"16px", letterSpacing:"0.3px" }}>{level}</span>
                    </div>
                    <div style={{ flex:1, height:"2px", background:`linear-gradient(to right,${(SECTION_STYLES[level] || SECTION_STYLES["Leadership Team"]).line},transparent)` }} />
                  </div>

                  <div className="row">
                    {groupedLeaders[level].map((leader) => (
                      <div key={leader.id} className="col-md-4 mb-4">
                        <div className="card h-100 shadow-sm leadershipCard">
                          <div className="row">
                            <div className="col-3">
                              {leader.profilePic && (
                                <img
                                  src={`/uploads/${leader.profilePic}`}
                                  className="card-img-top"
                                  alt={leader.name}
                                />
                              )}
                            </div>

                            <div className="col-9">
                              <div className="card-body">
                                <h5 className="card-title">
                                  {leader.name}
                                </h5>

                                <p className="card-subtitle text-muted mb-2">
                                  {leader.designation} | {leader.location}
                                </p>
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      <Footer />
    </>
  );
}

export default LeadershipPublicPage;