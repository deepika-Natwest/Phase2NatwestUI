import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import api from "../../services/api";

function TeamsPublicTablePage() {
  const [users, setUsers] = useState([]);
  const [loadedUserIds, setLoadedUserIds] = useState(new Set()); // ✅ Track unique users

  const [capabilitiesMap, setCapabilitiesMap] = useState({});
  const [franchisesMap, setFranchisesMap] = useState({});
  const [selectedCap, setSelectedCap] = useState("");
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [filters, setFilters] = useState({
    franchiseId: "",
    careerLevel: "",
    location: "",
    projectName: "",
    lineManager: "",
  });

  const [nameSearch, setNameSearch] = useState("");
  const [enterpriseIdSearch, setEnterpriseIdSearch] = useState("");

  // ✅ Fetch USERS with duplicate check
  const fetchUsers = async (pageNum = 1, append = false) => {
    try {
      setLoading(true);

      const res = await api.get(`/users?page=${pageNum}&limit=50`);

      const newUsers = Array.isArray(res.data)
        ? res.data
        : res.data.users || [];

      // ✅ Keep only NEW users
      const uniqueNewUsers = newUsers.filter(
        (u) => !loadedUserIds.has(u.id)
      );

      // ✅ Update ID set
      setLoadedUserIds((prev) => {
        const updated = new Set(prev);
        uniqueNewUsers.forEach((u) => updated.add(u.id));
        return updated;
      });

      // ✅ Set users
      setUsers((prev) =>
        append ? [...prev, ...uniqueNewUsers] : uniqueNewUsers
      );

      // ✅ Show button ONLY if new unique data exists
      setHasMore(uniqueNewUsers.length > 0);

    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch master data
  useEffect(() => {
    const fetchMaster = async () => {
      try {
        const [capsRes, frRes] = await Promise.all([
          api.get("/capabilities"),
          api.get("/franchises"),
        ]);

        const capMap = {};
        (capsRes.data || []).forEach((c) => {
          capMap[c.id] = c.name;
        });
        setCapabilitiesMap(capMap);

        const frMap = {};
        (frRes.data || []).forEach((f) => {
          frMap[f.id] = f.name;
        });
        setFranchisesMap(frMap);
      } catch (err) {
        console.error("Failed to load master data:", err);
      }
    };

    fetchMaster();
  }, []);

  // ✅ Initial load
  useEffect(() => {
    fetchUsers(1, false);
  }, []);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchUsers(nextPage, true);
  };

  const uniqueValues = (key) =>
    Array.from(new Set(users.map((u) => u[key]).filter(Boolean)));

  const filteredUsers = users.filter((u) => {
    return (
      (!selectedCap || u.capabilityId === selectedCap) &&
      (!filters.franchiseId || u.franchiseId === filters.franchiseId) &&
      (!filters.careerLevel || u.careerLevel === filters.careerLevel) &&
      (!filters.location || u.location === filters.location) &&
      (!filters.projectName || u.projectName === filters.projectName) &&
      (!filters.lineManager || u.lineManager === filters.lineManager) &&
      (!nameSearch ||
        u.name?.toLowerCase().includes(nameSearch.toLowerCase())) &&
      (!enterpriseIdSearch ||
        u.enterpriseId
          ?.toLowerCase()
          .includes(enterpriseIdSearch.toLowerCase()))
    );
  });

  const dropdownCapabilities = Array.from(
    new Set(users.map((u) => u.capabilityId).filter(Boolean))
  ).map((id) => ({
    id,
    name: capabilitiesMap[id] || "Unknown",
  }));

  if (loading && page === 1) {
    return <div className="text-center mt-5">Loading team members...</div>;
  }

  return (
    <>
      <Header />

      <div className="container my-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center">
            <span className="recog-main-side-line">👥</span>
            <span className="recog-main-title ms-2">
              Team Directory:{" "}
              {selectedCap ? capabilitiesMap[selectedCap] : "All"}
            </span>
          </div>

          <div className="d-flex gap-3 align-items-start">
            {/* BU */}
            <select
              className="form-select"
              style={{ minWidth: "180px" }}
              value={selectedCap}
              onChange={(e) => setSelectedCap(e.target.value)}
            >
              <option value="">BU</option>
              {dropdownCapabilities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* SBU + count */}
            <div>
              <select
                className="form-select"
                style={{ minWidth: "180px" }}
                value={filters.franchiseId}
                onChange={(e) =>
                  setFilters({ ...filters, franchiseId: e.target.value })
                }
              >
                <option value="">SBU</option>
                {Object.entries(franchisesMap).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>

              <div className="mt-3 text-center fw-semibold small text-muted">
               Team Size: {filteredUsers.length}
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="table table-bordered table-striped table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>#</th>

                <th style={{ width: "25%" }}>
                  Name
                  <input
                    className="form-control form-control-sm mt-1"
                    placeholder="Search name"
                    value={nameSearch}
                    onChange={(e) => setNameSearch(e.target.value)}
                  />
                </th>

                <th>
                  Enterprise ID
                  <input
                    className="form-control form-control-sm mt-1"
                    placeholder="Search ID"
                    value={enterpriseIdSearch}
                    onChange={(e) =>
                      setEnterpriseIdSearch(e.target.value)
                    }
                  />
                </th>

                <th>
                  Level
                  <select
                    className="form-select form-select-sm mt-1"
                    value={filters.careerLevel}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        careerLevel: e.target.value,
                      })
                    }
                  >
                    <option value=""></option>
                    {uniqueValues("careerLevel").map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </th>

                <th>
                  Location
                  <select
                    className="form-select form-select-sm mt-1"
                    value={filters.location}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        location: e.target.value,
                      })
                    }
                  >
                    <option value=""></option>
                    {uniqueValues("location").map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </th>

                <th>
                  Project/Program
                  <select
                    className="form-select form-select-sm mt-1"
                    value={filters.projectName}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        projectName: e.target.value,
                      })
                    }
                  >
                    <option value=""></option>
                    {uniqueValues("projectName").map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </th>

                <th>
                  NWG Line Manager
                  <select
                    className="form-select form-select-sm mt-1"
                    value={filters.lineManager}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        lineManager: e.target.value,
                      })
                    }
                  >
                    <option value=""></option>
                    {uniqueValues("lineManager").map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr key={user.id}>
                    <td>{index + 1}</td>
                    <td style={{ width: "25%" }}>{user.name}</td>
                    <td>{user.enterpriseId}</td>
                    <td>{user.careerLevel}</td>
                    <td>{user.location}</td>
                    <td>{user.projectName}</td>
                    <td>{user.lineManager}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ✅ Load More only when needed */}
        {hasMore && (
          <div className="text-center mt-3">
            <button
              className="btn btn-primary"
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}

export default TeamsPublicTablePage;