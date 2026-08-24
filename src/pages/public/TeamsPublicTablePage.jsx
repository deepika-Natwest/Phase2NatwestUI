import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import api from "../../services/api";

function TeamsPublicTablePage() {
  const [users, setUsers] = useState([]);
  const [loadedUserIds, setLoadedUserIds] = useState(new Set()); // ✅ Track unique users

  const navigate = useNavigate();

  const [capabilitiesMap, setCapabilitiesMap] = useState({});
  const [franchisesMap, setFranchisesMap] = useState({});
  const [selectedCap, setSelectedCap] = useState("");
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [filters, setFilters] = useState({
    franchiseId: [],
    careerLevel: [],
    location: [],
    projectName: [],
    lineManager: [],
  });

  const [openDropdown, setOpenDropdown] = useState("");

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
  const clearFilter = (field) => {
  setFilters((prev) => ({
    ...prev,
    [field]: [],
  }));
};

  // ✅ Toggle checkbox value
  const toggleFilterValue = (field, value) => {
  const stringValue = String(value);

  setFilters((prev) => {
    const current = prev[field] || [];

    return {
      ...prev,
      [field]: current.includes(stringValue)
        ? current.filter((v) => v !== stringValue)
        : [...current, stringValue],
    };
  });
};


  const filteredUsers = users.filter((u) => {
    return (
      (!selectedCap || String(u.capabilityId) === String(selectedCap)) &&

      (filters.franchiseId.length === 0 ||
        filters.franchiseId.includes(String(u.franchiseId))) &&

      (filters.careerLevel.length === 0 ||
        filters.careerLevel.includes(String(u.careerLevel))) &&

      (filters.location.length === 0 ||
        filters.location.includes(String(u.location))) &&

      (filters.projectName.length === 0 ||
        filters.projectName.includes(String(u.projectName))) &&

      (filters.lineManager.length === 0 ||
        filters.lineManager.includes(String(u.lineManager))) &&

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

  // ✅ Reusable dropdown with checkboxes
  const MultiFilterDropdown = ({ field, label, options }) => {
    const selectedCount = filters[field]?.length || 0;

    return (
      <div className="position-relative">
        <button
          type="button"
          className="form-select text-start"
          style={{
            minWidth: "170px",
            fontSize: "13px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          onClick={() =>
            setOpenDropdown(openDropdown === field ? "" : field)
          }
        >
          {selectedCount === 0 ? label : `${label}: ${selectedCount} selected`}
        </button>

        {openDropdown === field && (
          <div
            className="border bg-white shadow-sm rounded p-2"
            style={{
              position: "absolute",
              top: "40px",
              left: 0,
              zIndex: 999,
              width: "220px",
              maxHeight: "230px",
              overflowY: "auto",
            }}
          >
            <div
              className="fw-semibold text-primary mb-2"
              style={{ cursor: "pointer", fontSize: "13px" }}
              onClick={() => clearFilter(field)}
            >
              All / No Filter
            </div>

            {options.length === 0 ? (
              <div className="text-muted small">No options</div>
            ) : (
              options.map((option) => (
                <label
                  key={option.value}
                  className="d-flex align-items-center gap-2 mb-1"
                  style={{ fontSize: "13px", cursor: "pointer" }}
                >
                  <input
                    type="checkbox"
                    checked={filters[field].includes(String(option.value))}
                    onChange={() => toggleFilterValue(field, option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading && page === 1) {
    return <div className="text-center mt-5">Loading team members...</div>;
  }

  return (
    <>
      <Header />

      <div className="container my-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 teamHeading">
          <div className="d-flex align-items-center">
            <span className="recog-main-side-line trophy-emoji">👥</span>
            <span className="recog-main-title ms-2">
              Team Portal: {selectedCap ? capabilitiesMap[selectedCap] : "All"}
            </span>
          </div>

          <div className="d-flex gap-3 align-items-start">
            {/* Name Search */}
            <input
              type="text"
              className="form-control"
              placeholder="Search by name..."
              style={{ minWidth: "160px" }}
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
            />
            {/* Enterprise ID Search */}
            <input
              type="text"
              className="form-control"
              placeholder="Search by EID..."
              style={{ minWidth: "130px" }}
              value={enterpriseIdSearch}
              onChange={(e) => setEnterpriseIdSearch(e.target.value)}
            />
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
              <MultiFilterDropdown
                field="franchiseId"
                label="SBU"
                options={Object.entries(franchisesMap).map(([id, name]) => ({
                  value: id,
                  label: name,
                }))}
              />

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
                  <div className="mt-1">
                    <MultiFilterDropdown
                      field="careerLevel"
                      label="Level"
                      options={uniqueValues("careerLevel").map((lvl) => ({
                        value: lvl,
                        label: lvl,
                      }))}
                    />
                  </div>
                </th>

                <th>
                  Location
                  <div className="mt-1">
                    <MultiFilterDropdown
                      field="location"
                      label="Location"
                      options={uniqueValues("location").map((loc) => ({
                        value: loc,
                        label: loc,
                      }))}
                    />
                  </div>
                </th>

                <th>
                  Project/Program
                  <div className="mt-1">
                    <MultiFilterDropdown
                      field="projectName"
                      label="Project"
                      options={uniqueValues("projectName").map((p) => ({
                        value: p,
                        label: p,
                      }))}
                    />
                  </div>
                </th>

                <th>
                  NWG Line Manager
                  <div className="mt-1">
                    <MultiFilterDropdown
                      field="lineManager"
                      label="Manager"
                      options={uniqueValues("lineManager").map((m) => ({
                        value: m,
                        label: m,
                      }))}
                    />
                  </div>
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
                    <td>
                      <span
                        style={{
                          color: "#0d6efd",
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                        onClick={() => navigate(`/programs?highlight=${encodeURIComponent(user.projectName || "")}`)}
                      >
                        {user.projectName}
                      </span>
                    </td>

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
