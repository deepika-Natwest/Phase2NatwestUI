import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import api from "../../services/api";

function TeamsPublicPage() {
  const [users, setUsers] = useState([]);
  const [capabilitiesMap, setCapabilitiesMap] = useState({});
  const [franchisesMap, setFranchisesMap] = useState({});
  const [selectedCap, setSelectedCap] = useState("");
  const [loading, setLoading] = useState(true);

  // 🔥 NEW: track visible users per franchise
  const [visibleCount, setVisibleCount] = useState({});

  const USERS_PER_PAGE = 6;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [usersRes, capsRes, frRes] = await Promise.all([
          api.get("/users"),
          api.get("/capabilities"),
          api.get("/franchises"),
        ]);

        const usersData = Array.isArray(usersRes.data)
          ? usersRes.data
          : [usersRes.data];

        setUsers(usersData);

        // Capability map
        const capMap = {};
        (capsRes.data || []).forEach((c) => {
          capMap[c.id] = c.name;
        });
        setCapabilitiesMap(capMap);

        // Franchise map
        const frMap = {};
        (frRes.data || []).forEach((f) => {
          frMap[f.id] = {
            name: f.name,
            capabilityId: f.capabilityId,
          };
        });
        setFranchisesMap(frMap);

        // Default capability
        const capabilityCounts = {};
        usersData.forEach((u) => {
          if (u.capabilityId) {
            capabilityCounts[u.capabilityId] =
              (capabilityCounts[u.capabilityId] || 0) + 1;
          }
        });

        const firstCapWithUsers = Object.keys(capabilityCounts)[0] || "";
        setSelectedCap(firstCapWithUsers);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading)
    return <div className="text-center mt-5">Loading users...</div>;

  // Filter users
  const filteredUsers = selectedCap
    ? users.filter((u) => u.capabilityId === selectedCap)
    : [];

  // Group by franchise
  const groupedByFranchise = {};
  filteredUsers.forEach((user) => {
    const frId = user.franchiseId || "Unknown Franchise";
    if (!groupedByFranchise[frId]) groupedByFranchise[frId] = [];
    groupedByFranchise[frId].push(user);
  });

  const capabilityName = capabilitiesMap[selectedCap] || selectedCap;

  const dropdownCapabilities = Array.from(
    new Set(users.map((u) => u.capabilityId))
  ).map((id) => ({
    id,
    name: capabilitiesMap[id] || id,
  }));

  // 🔥 Load more handler
  const loadMore = (frId) => {
    setVisibleCount((prev) => ({
      ...prev,
      [frId]: (prev[frId] || USERS_PER_PAGE) + USERS_PER_PAGE,
    }));
  };

  return (
    <>
      <Header />

      <div className="recog-detailed-heading p-3 mb-5">
        <div className="container">
          <div className="row w100">
            <div className="col-10 d-flex">
              <span className="recog-main-side-line">
                <span role="img" aria-label="team">👥</span>
              </span>
              <span className="recog-main-title">
                TEAM: {capabilityName}
              </span>
            </div>

            <div className="col-2 mt-3">
              {dropdownCapabilities.length > 0 && (
                <select
                  className="form-select"
                  value={selectedCap}
                  onChange={(e) => {
                    setSelectedCap(e.target.value);
                    setVisibleCount({}); // reset pagination
                  }}
                >
                  {dropdownCapabilities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container my-5">
        {filteredUsers.length === 0 ? (
          <div className="text-center mt-5">
            No users found for this capability.
          </div>
        ) : (
          Object.entries(groupedByFranchise).map(([frId, usersInFr]) => {
            const visible = visibleCount[frId] || USERS_PER_PAGE;
            const usersToShow = usersInFr.slice(0, visible);
            const hasMore = usersInFr.length > visible;

            return (
              <div key={frId} className="mb-5">
                {/* 🔥 Franchise title with count */}
                <h3 className="section-title">
                  {franchisesMap[frId]?.name || frId} ({usersInFr.length})
                </h3>

                {/* 🔥 Smooth animation */}
                <div className="row transition-all">
                  {usersToShow.map((user) => (
                    <div key={user.id} className="col-md-4 mb-3">
                      <div className="card h-100 shadow-sm leadershipCard">
                        <div className="row">
                          <div className="col-3">
                            {user.profilePic && (
                              <img
                                src={`/uploads/users/${user.profilePic}`}
                                className="card-img-top"
                                alt={user.name}
                              />
                            )}
                          </div>

                          <div className="col-9">
                            <div className="card-body">
                              <h5 className="card-title">{user.name}</h5>

                              <p className="card-subtitle text-muted mb-2">
                                {user.enterpriseId} | {user.location}
                              </p>

                              <p>
                                Project: {user.projectName}
                                <br />
                                Manager: {user.lineManager}
                              </p>

                              {user.shortDescription && (
                                <p className="mt-2">
                                  {user.shortDescription}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 🔥 Load More */}
                {hasMore && (
                  <div className="text-center mt-3">
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => loadMore(frId)}
                    >
                      Load More ({usersInFr.length - visible} more)
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Footer />
    </>
  );
}

export default TeamsPublicPage;