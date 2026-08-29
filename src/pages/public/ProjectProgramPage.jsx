import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import api from "../../services/api";

function ProjectProgramPage() {
  const [users, setUsers] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [capabilities, setCapabilities] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [selectedBU, setSelectedBU] = useState("");
  const [selectedSBU, setSelectedSBU] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showEmployees, setShowEmployees] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [programSearch, setProgramSearch] = useState("");

  const [showDescPopup, setShowDescPopup] = useState(false);
  const [selectedDesc, setSelectedDesc] = useState({ title: "", text: "" });

  const [searchParams] = useSearchParams();
  const highlightProgram = searchParams.get("highlight");
  const highlightRef = useRef(null);

  useEffect(() => {
    Promise.all([
      fetchUsers(),
      api.get("/programs"),
      api.get("/capabilities"),
      api.get("/franchises"),
    ]).then(([, progsRes, capsRes, frsRes]) => {
      setPrograms(Array.isArray(progsRes.data) ? progsRes.data : progsRes.data?.programs || []);
      const capList = Array.isArray(capsRes.data) ? capsRes.data : capsRes.data?.capabilities || [];
      const frList  = Array.isArray(frsRes.data)  ? frsRes.data  : frsRes.data?.franchises  || [];
      setCapabilities(capList);
      setFranchises(frList);
    }).catch((err) => console.error("Error fetching programs/capabilities/franchises:", err));
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/users");
      const backendData =
        response.data?.users || response.data?.data || response.data?.content || response.data || [];
      setUsers(Array.isArray(backendData) ? backendData : []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load project/program data.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // BU = Capability (higher level); SBU = Franchise (sub-level)
  const getBU  = (u) => capabilities.find((c) => c.id === u.capabilityId)?.name || "NA";
  const getSBU = (u) => franchises.find((f) => f.id === u.franchiseId)?.name   || "NA";
  const getProjectName = (u) => u.projectName || u.project || u.programName || u.program || u.projectProgram || "NA";
  const getEmployeeName= (u) => u.name || u.employeeName || u.fullName || u.employeeFullName || u.userName || "NA";
  const getEnterpriseId= (u) => u.enterpriseId || u.enterpriseID || u.eid || u.email || "NA";
  const getCareerLevel = (u) => u.careerLevel || u.level || u.jobLevel || "NA";
  const getLocation    = (u) => u.location || u.baseLocation || u.officeLocation || "NA";
  const getLineManager = (u) => u.lineManager || u.nwgLineManager || u.manager || u.peopleLead || u.supervisor || "NA";

  // Active = has ≥1 user assigned; ignores stored isActive flag
  const isEffectivelyActive = (prog, assignedNames) => {
    if (!prog.capabilityId && !prog.franchiseId) return false;
    return assignedNames.has(prog.name.toLowerCase().trim());
  };

  // Build a lookup: program name (lowercased) → array of enriched entries sorted newest first
  const programMap = useMemo(() => {
    const map = {};
    programs.forEach((p) => {
      const key = p.name.toLowerCase().trim();
      const capName = capabilities.find((c) => c.id === p.capabilityId)?.name || "";
      const frName  = franchises.find((f) => f.id === p.franchiseId)?.name  || "";
      if (!map[key]) map[key] = [];
      map[key].push({ ...p, capabilityName: capName, franchiseName: frName });
    });
    // Sort each group newest first
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    );
    return map;
  }, [programs, capabilities, franchises]);

  const projectRows = useMemo(() => {
    const nonAdminUsers = users.filter((u) => u.role?.toUpperCase() !== "ADMIN");
    // Build assigned names from user data so isEffectivelyActive gets the right set
    const assignedNames = new Set(
      nonAdminUsers
        .map((u) => getProjectName(u).toLowerCase().trim())
        .filter((n) => n && n !== "na")
    );

    const grouped = {};
    nonAdminUsers.forEach((user) => {
        const projectName = getProjectName(user);
        const entries     = programMap[projectName.toLowerCase().trim()] || [];
        const adminProg   = entries[0]; // latest entry

        // Prefer admin-configured BU/SBU; fall back to user fields
        const bu  = adminProg?.capabilityName || getBU(user);
        const sbu = adminProg?.franchiseName  || getSBU(user);

        const key = `${bu}__${sbu}__${projectName}`;
        if (!grouped[key]) {
          grouped[key] = {
            bu, sbu, projectName,
            description: adminProg?.description || user.description || user.projectDescription || "Project description will be updated soon.",
            isActive: adminProg ? isEffectivelyActive(adminProg, assignedNames) : true,
            history: entries,  // all entries sorted newest first
            employees:    [],
            lineManagers: [],
          };
        }
        grouped[key].employees.push(user);
        const manager = getLineManager(user);
        if (manager && manager !== "NA" && !grouped[key].lineManagers.includes(manager))
          grouped[key].lineManagers.push(manager);
      });

    // Programs in admin list with no users assigned → mark as inactive
    Object.entries(programMap).forEach(([programKey, entries]) => {
      if (!assignedNames.has(programKey)) {
        const adminProg = entries[0];
        const bu  = adminProg?.capabilityName || "NA";
        const sbu = adminProg?.franchiseName  || "NA";
        const name = adminProg?.name || programKey;
        const key  = `${bu}__${sbu}__${name}`;
        if (!grouped[key]) {
          grouped[key] = {
            bu, sbu,
            projectName: name,
            description: adminProg?.description || "",
            isActive: false,
            history: entries,
            employees: [],
            lineManagers: [],
          };
        }
      }
    });

    return Object.values(grouped);
  }, [users, programMap]);

  useEffect(() => {
    if (highlightProgram && highlightRef.current)
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightProgram, projectRows]);

  const buOptions = useMemo(
    () => [...new Set(projectRows.map((r) => r.bu).filter(Boolean))].sort(),
    [projectRows]
  );

  const sbuOptions = useMemo(
    () => [
      ...new Set(
        projectRows
          .filter((r) => (selectedBU ? r.bu === selectedBU : true))
          .map((r) => r.sbu)
          .filter(Boolean)
      ),
    ].sort(),
    [projectRows, selectedBU]
  );

  const filteredPrograms = useMemo(() => {
    return projectRows.filter((r) => {
      const buMatch     = selectedBU  ? r.bu  === selectedBU  : true;
      const sbuMatch    = selectedSBU ? r.sbu === selectedSBU : true;
      const statusMatch =
        statusFilter === "active"   ?  r.isActive :
        statusFilter === "inactive" ? !r.isActive : true;
      return buMatch && sbuMatch && statusMatch;
    });
  }, [projectRows, selectedBU, selectedSBU, statusFilter]);

  const displayedRows = useMemo(() => {
    if (!programSearch) return filteredPrograms;
    const q = programSearch.toLowerCase();
    return filteredPrograms.filter((r) => r.projectName?.toLowerCase().includes(q));
  }, [filteredPrograms, programSearch]);

  const handleBUChange = (e) => { setSelectedBU(e.target.value); setSelectedSBU(""); };

  const openEmployeePopup = (program) => {
    setSelectedProgram(program.projectName);
    setSelectedEmployees(program.employees || []);
    setShowEmployees(true);
  };
  const closeEmployeePopup = () => { setShowEmployees(false); setSelectedProgram(""); setSelectedEmployees([]); };

  return (
    <>
      <Header />

      {/* Full-width gradient heading */}
      <div className="recog-detailed-heading">
        <div className="container">
          <div className="row w-100 align-items-center">
            <div className="col-4 d-flex align-items-center">
              <span className="recog-main-side-line trophy-emoji">📋</span>
              <span className="recog-main-title ms-2">Project / Programs</span>
            </div>
            <div className="col-2 mt-3 ms-auto">
              <select className="form-select" style={{ fontSize: "13px" }} value={selectedBU} onChange={handleBUChange}>
                <option value="">All BUs</option>
                {buOptions.map((bu) => <option key={bu} value={bu}>{bu}</option>)}
              </select>
            </div>
            <div className="col-2 mt-3">
              <select className="form-select" style={{ fontSize: "13px" }} value={selectedSBU} onChange={(e) => setSelectedSBU(e.target.value)}>
                <option value="">All SBUs</option>
                {sbuOptions.map((sbu) => <option key={sbu} value={sbu}>{sbu}</option>)}
              </select>
            </div>
            <div className="col-2 mt-3">
              <select className="form-select" style={{ fontSize: "13px" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Programs</option>
                <option value="active">Active Programs</option>
                <option value="inactive">Inactive Programs</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="container my-4">
        {loading && (
          <div className="text-center my-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <div className="mt-2">Loading project/program data...</div>
          </div>
        )}

        {!loading && error && <div className="alert alert-danger">{error}</div>}

        {!loading && !error && (
          <>
            <div className="mb-3">
              <input type="text" className="form-control" placeholder="Search by program name..."
                style={{ maxWidth: "300px" }} value={programSearch}
                onChange={(e) => setProgramSearch(e.target.value)} />
            </div>

            <div className="table-responsive" style={{ maxHeight: "65vh", overflowY: "auto" }}>
              <table className="table table-bordered table-hover table-striped align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f8f9fa", width: "60px" }}>#</th>
                    <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f8f9fa" }}>BU</th>
                    <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f8f9fa" }}>SBU</th>
                    <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f8f9fa" }}>Program / Project</th>
                    <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f8f9fa", minWidth: "300px" }}>Description</th>
                    <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f8f9fa", textAlign: "center" }}>Employees</th>
                    <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f8f9fa" }}>Line Managers</th>
                    <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f8f9fa" }}>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedRows.length > 0 ? (
                    displayedRows.map((item, index) => {
                      const isHighlighted =
                        highlightProgram &&
                        item.projectName?.toLowerCase() === highlightProgram.toLowerCase();
                      return (
                        <tr key={`${item.bu}-${item.sbu}-${item.projectName}-${index}`}
                          ref={isHighlighted ? highlightRef : null}
                          style={isHighlighted ? { backgroundColor: "#fff3cd", outline: "2px solid #ffc107" } : undefined}>
                          <td>{index + 1}</td>
                          <td>{item.bu}</td>
                          <td>{item.sbu}</td>
                          <td className="fw-semibold">{item.projectName}</td>
                          <td style={{ maxWidth: "300px" }}>
                            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {item.description}
                            </div>
                            {item.description && (
                              <span style={{ color: "#0d6efd", cursor: "pointer", fontSize: "12px" }}
                                onClick={() => { setSelectedDesc({ title: item.projectName, text: item.description, history: item.history || [] }); setShowDescPopup(true); }}>
                                Read More
                              </span>
                            )}
                          </td>
                          <td className="text-center">
                            <button type="button" className="btn btn-link p-0 fw-bold text-decoration-none"
                              onClick={() => openEmployeePopup(item)}>
                              {item.employees.length}
                            </button>
                          </td>
                          <td>{item.lineManagers.length > 0 ? item.lineManagers.join(", ") : "NA"}</td>
                          <td>
                            {item.isActive
                              ? <span className="badge bg-success">Active</span>
                              : <span className="badge bg-danger">Inactive</span>}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan="8" className="text-center py-4">No Records Found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Description / Commentary popup */}
        {showDescPopup && (
          <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center",
            alignItems: "center", zIndex: 100000 }}
            onClick={() => setShowDescPopup(false)}>
            <div style={{ background: "#fff", width: "600px", maxWidth: "92%", padding: "28px",
              borderRadius: "10px", boxShadow: "0 4px 28px rgba(0,0,0,0.3)", maxHeight: "82vh", overflowY: "auto" }}
              onClick={(e) => e.stopPropagation()}>
              <h5 className="fw-bold mb-1">{selectedDesc.title}</h5>
              <p className="text-muted small mb-3">Program history — latest entry first</p>
              <hr className="mt-0 mb-3" />

              {(selectedDesc.history || []).length === 0 ? (
                <p style={{ whiteSpace: "pre-line", lineHeight: "1.7" }}>{selectedDesc.text}</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {(selectedDesc.history || []).map((entry, idx) => (
                    <div key={entry.id || idx} style={{
                      borderLeft: `4px solid ${idx === 0 ? "#4a148c" : "#dee2e6"}`,
                      paddingLeft: "14px",
                      opacity: idx === 0 ? 1 : 0.72,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{
                          fontSize: "12px", fontWeight: 700,
                          color: idx === 0 ? "#4a148c" : "#888",
                        }}>
                          {entry.date || "No date"}
                        </span>
                        {idx === 0 && (
                          <span className="badge" style={{ background: "#4a148c", fontSize: "10px" }}>Latest</span>
                        )}
                        {entry.capabilityName && (
                          <span className="badge bg-light text-dark border" style={{ fontSize: "10px" }}>
                            {entry.capabilityName}{entry.franchiseName ? ` › ${entry.franchiseName}` : ""}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, lineHeight: "1.65", fontSize: "14px", whiteSpace: "pre-line", color: idx === 0 ? "#212529" : "#555" }}>
                        {entry.description || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-end mt-4">
                <button className="btn btn-primary" onClick={() => setShowDescPopup(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Employee popup */}
        {showEmployees && (
          <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100000 }} tabIndex="-1">
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{selectedProgram} - Employees</h5>
                  <button type="button" className="btn-close" onClick={closeEmployeePopup} />
                </div>
                <div className="modal-body">
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: "60px" }}>#</th>
                          <th>Employee Name</th>
                          <th>Enterprise ID</th>
                          <th>Level</th>
                          <th>Location</th>
                          <th>Line Manager</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEmployees.length > 0 ? (
                          selectedEmployees.map((emp, idx) => (
                            <tr key={emp.id || emp.employeeId || emp.enterpriseId || idx}>
                              <td>{idx + 1}</td>
                              <td>{getEmployeeName(emp)}</td>
                              <td>{getEnterpriseId(emp)}</td>
                              <td>{getCareerLevel(emp)}</td>
                              <td>{getLocation(emp)}</td>
                              <td>{getLineManager(emp)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="6" className="text-center py-4">No Employees Found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeEmployeePopup}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}

export default ProjectProgramPage;
