import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { getPublicLeadership } from "../../features/leadership/publicLeadershipService";

const MANAGEMENT_ORDER = [
  "Leadership Team",
  "Senior Delivery Managers",
  "Sales Executive Managers",
];

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
              <span className="recog-main-side-line">
                <span role="img" aria-label="crown">👑</span>
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
                  <h3 className="section-title">{level}</h3>

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