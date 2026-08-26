import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import api from "../../services/api";

function TeamsPublicTablePage() {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  const [capabilitiesMap, setCapabilitiesMap] = useState({});
  const [franchisesMap, setFranchisesMap] = useState({});
  const [selectedCap, setSelectedCap] = useState("");
  const [loading, setLoading] = useState(true);

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

  // Close dropdown on outside click
  useEffect(() => {
    if (!openDropdown) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".multi-filter-dropdown")) setOpenDropdown("");
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [openDropdown]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users?limit=2000");
      const userList = Array.isArray(res.data) ? res.data : res.data.users || [];
      setUsers(userList);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchMaster = async () => {
      try {
        const [capsRes, frRes] = await Promise.all([
          api.get("/capabilities"),
          api.get("/franchises"),
        ]);
        const capList = Array.isArray(capsRes.data)
          ? capsRes.data
          : capsRes.data?.capabilities || capsRes.data?.data || [];
        const capMap = {};
        capList.forEach((c) => { capMap[c.id] = c.name; });
        setCapabilitiesMap(capMap);

        const frList = Array.isArray(frRes.data)
          ? frRes.data
          : frRes.data?.franchises || frRes.data?.data || [];
        const frMap = {};
        frList.forEach((f) => { frMap[f.id] = f.name; });
        setFranchisesMap(frMap);
      } catch (err) {
        console.error("Failed to load master data:", err);
      }
    };
    fetchMaster();
  }, []);

  useEffect(() => { fetchUsers(); }, []);

  const uniqueValues = (key) =>
    Array.from(new Set(users.map((u) => u[key]).filter(Boolean)));

  const clearFilter = (field) =>
    setFilters((prev) => ({ ...prev, [field]: [] }));

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
      (filters.franchiseId.length === 0 || filters.franchiseId.includes(String(u.franchiseId))) &&
      (filters.careerLevel.length === 0 || filters.careerLevel.includes(String(u.careerLevel))) &&
      (filters.location.length === 0    || filters.location.includes(String(u.location)))    &&
      (filters.projectName.length === 0 || filters.projectName.includes(String(u.projectName))) &&
      (filters.lineManager.length === 0 || filters.lineManager.includes(String(u.lineManager))) &&
      (!nameSearch         || u.name?.toLowerCase().includes(nameSearch.toLowerCase())) &&
      (!enterpriseIdSearch || u.enterpriseId?.toLowerCase().includes(enterpriseIdSearch.toLowerCase()))
    );
  });

  // All BUs from admin capabilities (not filtered by users present)
  const dropdownCapabilities = Object.entries(capabilitiesMap).map(([id, name]) => ({ id, name }));

  // All SBUs from admin franchises; fall back to user-derived values if map is empty
  const franchiseOptions =
    Object.keys(franchisesMap).length > 0
      ? Object.entries(franchisesMap).map(([id, name]) => ({ value: id, label: name }))
      : uniqueValues("franchiseId").map((v) => ({ value: v, label: v }));

  const MultiFilterDropdown = ({ field, label, options }) => {
    const selectedCount = filters[field]?.length || 0;
    return (
      <div className="position-relative multi-filter-dropdown">
        <button
          type="button"
          className="form-select text-start"
          style={{ minWidth: "170px", fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
          onClick={() => setOpenDropdown(openDropdown === field ? "" : field)}
        >
          {selectedCount === 0 ? label : `${label}: ${selectedCount} selected`}
        </button>
        {openDropdown === field && (
          <div className="border bg-white shadow-sm rounded p-2"
            style={{ position: "absolute", top: "40px", left: 0, zIndex: 999, width: "220px", maxHeight: "230px", overflowY: "auto" }}>
            <div className="fw-semibold text-primary mb-2" style={{ cursor: "pointer", fontSize: "13px" }}
              onClick={() => clearFilter(field)}>
              All / No Filter
            </div>
            {options.length === 0 ? (
              <div className="text-muted small">No options</div>
            ) : (
              options.map((option) => (
                <label key={option.value} className="d-flex align-items-center gap-2 mb-1"
                  style={{ fontSize: "13px", cursor: "pointer" }}>
                  <input type="checkbox"
                    checked={filters[field].includes(String(option.value))}
                    onChange={() => toggleFilterValue(field, option.value)} />
                  <span>{option.label}</span>
                </label>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="container text-center mt-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="mt-2">Loading team members...</div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      {/* Full-width gradient header */}
      <div className="recog-detailed-heading">
        <div className="container">
          <div className="row w-100 align-items-center">
            <div className="col-4 d-flex align-items-center">
              <span className="recog-main-side-line trophy-emoji">👥</span>
              <span className="recog-main-title ms-2">
                Team Portal
              </span>
            </div>
            <div className="col-3 mt-3 ms-auto">
              <select className="form-select" style={{ fontSize: "13px" }}
                value={selectedCap} onChange={(e) => setSelectedCap(e.target.value)}>
                <option value="">All BUs</option>
                {dropdownCapabilities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="col-3 mt-3">
              <MultiFilterDropdown
                field="franchiseId"
                label="SBU"
                options={franchiseOptions}
              />
            </div>
            <div className="col-2 mt-3 d-flex align-items-center justify-content-end">
              <span className="fw-semibold small text-white">
                Team Size: <strong style={{ color: "#fff" }}>{filteredUsers.length}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container my-4">
        <div className="table-responsive" style={{ maxHeight: "65vh", overflowY: "auto" }}>
          <table className="table table-bordered table-striped table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f8f9fa" }}>#</th>

                <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f8f9fa", width: "25%" }}>
                  Name
                  <input className="form-control form-control-sm mt-1" placeholder="Search name"
                    value={nameSearch} onChange={(e) => setNameSearch(e.target.value)} />
                </th>

                <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f8f9fa" }}>
                  Enterprise ID
                  <input className="form-control form-control-sm mt-1" placeholder="Search ID"
                    value={enterpriseIdSearch} onChange={(e) => setEnterpriseIdSearch(e.target.value)} />
                </th>

                <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f8f9fa" }}>
                  Level
                  <div className="mt-1">
                    <MultiFilterDropdown field="careerLevel" label="Level"
                      options={uniqueValues("careerLevel").map((lvl) => ({ value: lvl, label: lvl }))} />
                  </div>
                </th>

                <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f8f9fa" }}>
                  Location
                  <div className="mt-1">
                    <MultiFilterDropdown field="location" label="Location"
                      options={uniqueValues("location").map((loc) => ({ value: loc, label: loc }))} />
                  </div>
                </th>

                <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f8f9fa" }}>
                  Project/Program
                  <div className="mt-1">
                    <MultiFilterDropdown field="projectName" label="Project"
                      options={uniqueValues("projectName").map((p) => ({ value: p, label: p }))} />
                  </div>
                </th>

                <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f8f9fa" }}>
                  NWG Line Manager
                  <div className="mt-1">
                    <MultiFilterDropdown field="lineManager" label="Manager"
                      options={uniqueValues("lineManager").map((m) => ({ value: m, label: m }))} />
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan="7" className="text-center">No users found</td></tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr key={user.id}>
                    <td>{index + 1}</td>
                    <td style={{ width: "25%" }}>{user.name}</td>
                    <td>{user.enterpriseId}</td>
                    <td>{user.careerLevel}</td>
                    <td>{user.location}</td>
                    <td>
                      <span style={{ color: "#0d6efd", cursor: "pointer", textDecoration: "underline" }}
                        onClick={() => navigate(`/program?highlight=${encodeURIComponent(user.projectName || "")}`)}>
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


      </div>

      <Footer />
    </>
  );
}

export default TeamsPublicTablePage;
