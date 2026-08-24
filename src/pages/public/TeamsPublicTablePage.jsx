import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import api from "../../services/api";

function TeamsPublicTablePage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loadedUserIds, setLoadedUserIds] = useState(new Set()); // ✅ Track unique users

  const [capabilitiesMap, setCapabilitiesMap] = useState({});
  const [franchisesMap, setFranchisesMap] = useState({});
  const [selectedCap, setSelectedCap] = useState("");
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [selectedProject, setSelectedProject] = useState("");
const [showPopup, setShowPopup] = useState(false);

const projectDescriptions = {
  "Single Pane of Glass":
    "A centralized platform that provides a unified view of business data, applications, and operational metrics. It enables users to access information from multiple systems through a single interface, improving visibility, decision-making, and operational efficiency.",

  "NA":
    "Project description will be updated soon.",

  "Exits (Exodus)":
    "Exodus is an application designed to streamline and manage employee exit processes. It helps coordinate exit workflows, track approvals, maintain compliance, and provide visibility into offboarding activities for HR and business stakeholders.",

  "DLS":
    "DLS is a data-driven platform that supports business operations by managing, processing, and delivering critical datasets. It focuses on ensuring data quality, reliability, and timely availability for reporting and downstream applications.",

  "Kepler":
    "Kepler is an enterprise solution that enables data integration, analytics, and operational insights. It consolidates information from multiple sources to provide actionable intelligence for business users and leadership teams.",

  "GenAI Gateway":
    "GenAI Gateway provides a secure and standardized interface for accessing Generative AI capabilities across the organization. It simplifies AI adoption by offering centralized authentication, governance, API management, and integration with approved Large Language Models (LLMs).",

  "ETD & SFT POCs":
    "A collection of Proof of Concepts (POCs) focused on evaluating Enterprise Technology Development (ETD) and Smart Factory Technologies (SFT). These initiatives explore innovative solutions, validate technical feasibility, and assess business value before production implementation.",

  "Leapfrog":
    "Leapfrog is an innovation initiative aimed at accelerating digital transformation through modern technologies, process automation, and improved user experiences. The project focuses on delivering scalable solutions that enhance productivity and operational excellence.",

  "Genesis":
    "Genesis is a case reporting and data processing platform that extracts case-related data from MongoDB, applies data quality checks and business validations, and delivers a consolidated reporting dataset in Snowflake. The platform ensures accurate, consistent, and timely availability of case information through the ALL_CASE_REPORT dataset for business reporting and downstream analytical consumption. The Streamlit application consumes data from ALL_CASE_REPORT as part of the Genesis data pipeline. It includes the Genesis Custom Reporting dashboard, which is used by the Operations team for business reporting and analytical insights."
};


  const [filters, setFilters] = useState({
    franchiseId: [],
    careerLevel: [],
    location: [],
    projectName: [],
    lineManager: [],
  });

  const [openDropdown, setOpenDropdown] = useState("");

  // Close any open dropdown when clicking outside its container
  useEffect(() => {
    if (!openDropdown) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".multi-filter-dropdown")) {
        setOpenDropdown("");
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [openDropdown]);

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
      u.role?.toUpperCase() !== "ADMIN" &&

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
    name: capabilitiesMap[id] || id,
  }));

  // ✅ Reusable dropdown with checkboxes
  const MultiFilterDropdown = ({ field, label, options }) => {
    const selectedCount = filters[field]?.length || 0;

    return (
      <div className="position-relative multi-filter-dropdown">
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

      {/* ── Page heading — matches Events / Recognition style ── */}
      <div className="recog-detailed-heading p-3 mb-4">
        <div className="container">
          <div className="row w100 align-items-center">
            <div className="col-6 d-flex">
              <span className="recog-main-side-line">
                <span className="trophy-emoji" role="img" aria-label="team">👥</span>
              </span>
              <span className="recog-main-title">
                Team Portal{selectedCap ? `: ${capabilitiesMap[selectedCap]}` : ""}
              </span>
            </div>
            <div className="col-2 mt-3">
              <select
                className="form-select"
                style={{ fontSize: "13px" }}
                value={selectedCap}
                onChange={(e) => setSelectedCap(e.target.value)}
              >
                <option value="">All BUs</option>
                {dropdownCapabilities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="col-2 mt-3">
              <MultiFilterDropdown
                field="franchiseId"
                label="SBU"
                options={Object.entries(franchisesMap).map(([id, name]) => ({
                  value: id,
                  label: name,
                }))}
              />
            </div>
            <div className="col-2 mt-3 d-flex align-items-center justify-content-center">
              <span className="fw-semibold small text-muted">
                Team Size: <strong style={{ color: "#25185c" }}>{filteredUsers.length}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container my-4">
        {/* Table */}
        <div className="table-responsive" style={{ maxHeight: "65vh", overflowY: "auto" }}>
          <table className="table table-bordered table-striped table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f8f9fa" }}>#</th>

                <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f8f9fa", width: "25%" }}>
                  Name
                  <input
                    className="form-control form-control-sm mt-1"
                    placeholder="Search name"
                    value={nameSearch}
                    onChange={(e) => setNameSearch(e.target.value)}
                  />
                </th>

                <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f8f9fa" }}>
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

                <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f8f9fa" }}>
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

                <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f8f9fa" }}>
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

                <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f8f9fa" }}>
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

                <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f8f9fa" }}>
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
    onClick={() => navigate("/program", { state: { highlightProgram: user.projectName } })}
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
{showPopup && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
    }}
  >
    <div
      style={{
        background: "#fff",
        width: "500px",
        maxWidth: "90%",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
      }}
    >
      <h4>{selectedProject}</h4>

      <hr />

      <p style={{ whiteSpace: "pre-line" }}>
        {projectDescriptions[selectedProject] ||
          "Description not available."}
      </p>

      <div style={{ textAlign: "right" }}>
        <button
          className="btn btn-primary"
          onClick={() => setShowPopup(false)}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

      <Footer />
    </>
  );
}

export default TeamsPublicTablePage;
