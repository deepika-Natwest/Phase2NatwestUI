import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import api from "../../services/api";

function ProjectProgramPage() {
  const location = useLocation();
  const highlightProgram = location.state?.highlightProgram || null;
  const highlightedRowRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [adminPrograms, setAdminPrograms] = useState([]);
  const [capMap, setCapMap] = useState({});
  const [frMap, setFrMap] = useState({});

  const [selectedBU, setSelectedBU] = useState("");
  const [selectedSBU, setSelectedSBU] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "active" | "inactive"

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showEmployees, setShowEmployees] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState([]);

  const [showDescPopup, setShowDescPopup] = useState(false);
  const [selectedDesc, setSelectedDesc] = useState({ title: "", text: "" });

  const projectDescriptions = {
    "Single Pane of Glass":
      "A centralized platform that provides a unified view of business data, applications, and operational metrics. It enables users to access information from multiple systems through a single interface, improving visibility, decision-making, and operational efficiency.",

    NA: "Project description will be updated soon.",

    "Exits (Exodus)":
      "Exodus is an application designed to streamline and manage employee exit processes. It helps coordinate exit workflows, track approvals, maintain compliance, and provide visibility into offboarding activities for HR and business stakeholders.",

    DLS:
      "DLS is a data-driven platform that supports business operations by managing, processing, and delivering critical datasets. It focuses on ensuring data quality, reliability, and timely availability for reporting and downstream applications.",

    Kepler:
      "Kepler is an enterprise solution that enables data integration, analytics, and operational insights. It consolidates information from multiple sources to provide actionable intelligence for business users and leadership teams.",

    "GenAI Gateway":
      "GenAI Gateway provides a secure and standardized interface for accessing Generative AI capabilities across the organization. It simplifies AI adoption by offering centralized authentication, governance, API management, and integration with approved Large Language Models.",

    "ETD & SFT POCs":
      "A collection of Proof of Concepts focused on evaluating Enterprise Technology Development and Smart Factory Technologies. These initiatives explore innovative solutions, validate technical feasibility, and assess business value before production implementation.",

    Leapfrog:
      "Leapfrog is an innovation initiative aimed at accelerating digital transformation through modern technologies, process automation, and improved user experiences. The project focuses on delivering scalable solutions that enhance productivity and operational excellence.",

    Genesis:
      "Genesis is a case reporting and data processing platform that extracts case-related data from MongoDB, applies data quality checks and business validations, and delivers a consolidated reporting dataset in Snowflake. The platform ensures accurate, consistent, and timely availability of case information through the ALL_CASE_REPORT dataset for business reporting and downstream analytical consumption.",
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError("");

        const [usersRes, programsRes, capsRes, frRes] = await Promise.all([
          api.get("/users"),
          api.get("/programs"),
          api.get("/capabilities"),
          api.get("/franchises"),
        ]);

        const backendData =
          usersRes.data?.users ||
          usersRes.data?.data ||
          usersRes.data?.content ||
          usersRes.data ||
          [];
        setUsers(Array.isArray(backendData) ? backendData : []);

        setAdminPrograms(Array.isArray(programsRes.data) ? programsRes.data : []);

        const cMap = {};
        (capsRes.data || []).forEach((c) => { cMap[c.id] = c.name; });
        setCapMap(cMap);

        const fMap = {};
        (frRes.data || []).forEach((f) => { fMap[f.id] = f.name; });
        setFrMap(fMap);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load project/program data.");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const getBU = (user) =>
    user.bu || user.businessUnit || user.franchise || user.franchiseName || user.franchiseId || "NA";

  const getSBU = (user) =>
    user.sbu || user.subBusinessUnit || user.capability || user.capabilityName || user.capabilityId || "NA";

  const getProjectName = (user) =>
    user.projectName || user.project || user.programName || user.program || user.projectProgram || "NA";

  const getEmployeeName = (user) =>
    user.name || user.employeeName || user.fullName || user.employeeFullName || user.userName || "NA";

  const getEnterpriseId = (user) =>
    user.enterpriseId || user.enterpriseID || user.eid || user.email || "NA";

  const getCareerLevel = (user) =>
    user.careerLevel || user.level || user.jobLevel || "NA";

  const getLocation = (user) =>
    user.location || user.baseLocation || user.officeLocation || "NA";

  const getLineManager = (user) =>
    user.lineManager || user.nwgLineManager || user.manager || user.peopleLead || user.supervisor || "NA";

  // A program is effectively active only when isActive !== false
  // AND at least one of capability or franchise is assigned.
  const isEffectivelyActive = (prog) => {
    if (prog.isActive === false) return false;
    if (!prog.capabilityId && !prog.franchiseId) return false;
    return true;
  };

  const projectRows = useMemo(() => {
    // Admin-defined programs (take precedence)
    const adminRows = adminPrograms.map((prog) => {
      const programEmployees = users.filter(
        (u) => u.role?.toUpperCase() !== "ADMIN" && u.projectName === prog.name
      );
      const lineManagers = [
        ...new Set(
          programEmployees.map((u) => getLineManager(u)).filter((m) => m !== "NA")
        ),
      ];
      return {
        bu: capMap[prog.capabilityId] || prog.capabilityId || "NA",
        sbu: frMap[prog.franchiseId] || prog.franchiseId || "NA",
        projectName: prog.name,
        description: prog.description || "Project description will be updated soon.",
        date: prog.date || "",
        employees: programEmployees,
        lineManagers,
        isActive: isEffectivelyActive(prog),
        isAdminProgram: true,
      };
    });

    const adminNames = new Set(adminPrograms.map((p) => p.name));

    // User-derived programs — only those not already defined in admin
    const grouped = {};
    users.forEach((user) => {
      if (user.role?.toUpperCase() === "ADMIN") return;
      const projectName = getProjectName(user);
      if (adminNames.has(projectName)) return;

      const bu = getBU(user);
      const sbu = getSBU(user);
      const key = `${bu}__${sbu}__${projectName}`;

      if (!grouped[key]) {
        grouped[key] = {
          bu,
          sbu,
          projectName,
          description:
            projectDescriptions[projectName] ||
            user.description ||
            user.projectDescription ||
            "Project description will be updated soon.",
          date: "",
          employees: [],
          lineManagers: [],
          isActive: true,      // user-derived programs are always active
          isAdminProgram: false,
        };
      }

      grouped[key].employees.push(user);

      const manager = getLineManager(user);
      if (manager && manager !== "NA" && !grouped[key].lineManagers.includes(manager)) {
        grouped[key].lineManagers.push(manager);
      }
    });

    return [...adminRows, ...Object.values(grouped)];
  }, [users, adminPrograms, capMap, frMap]);

  const buOptions = useMemo(() => {
    return [...new Set(projectRows.map((item) => item.bu).filter(Boolean))].sort();
  }, [projectRows]);

  const sbuOptions = useMemo(() => {
    return [
      ...new Set(
        projectRows
          .filter((item) => (selectedBU ? item.bu === selectedBU : true))
          .map((item) => item.sbu)
          .filter(Boolean)
      ),
    ].sort();
  }, [projectRows, selectedBU]);

  const filteredPrograms = useMemo(() => {
    return projectRows.filter((item) => {
      const buMatch     = selectedBU     ? item.bu === selectedBU   : true;
      const sbuMatch    = selectedSBU    ? item.sbu === selectedSBU  : true;
      const statusMatch =
        statusFilter === "active"   ?  item.isActive :
        statusFilter === "inactive" ? !item.isActive :
        true;
      return buMatch && sbuMatch && statusMatch;
    });
  }, [projectRows, selectedBU, selectedSBU, statusFilter]);

  useEffect(() => {
    if (highlightProgram && highlightedRowRef.current) {
      highlightedRowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [filteredPrograms, highlightProgram]);

  const handleBUChange = (e) => {
    setSelectedBU(e.target.value);
    setSelectedSBU("");
  };

  const openEmployeePopup = (program) => {
    setSelectedProgram(program.projectName);
    setSelectedEmployees(program.employees || []);
    setShowEmployees(true);
  };

  const closeEmployeePopup = () => {
    setShowEmployees(false);
    setSelectedProgram("");
    setSelectedEmployees([]);
  };

  return (
    <>
      <Header />

      {/* ── Page heading — matches Events / Recognition style ── */}
      <div className="recog-detailed-heading p-3 mb-4">
        <div className="container">
          <div className="row w100">
            <div className="col-6 d-flex">
              <span className="recog-main-side-line">
                <span className="trophy-emoji" role="img" aria-label="programs">📋</span>
              </span>
              <span className="recog-main-title">Project / Programs</span>
            </div>
            <div className="col-2 mt-3">
              <select
                className="form-select"
                style={{ fontSize: "13px" }}
                value={selectedBU}
                onChange={handleBUChange}
              >
                <option value="">All BUs</option>
                {buOptions.map((bu) => (
                  <option key={bu} value={bu}>{bu}</option>
                ))}
              </select>
            </div>
            <div className="col-2 mt-3">
              <select
                className="form-select"
                style={{ fontSize: "13px" }}
                value={selectedSBU}
                onChange={(e) => setSelectedSBU(e.target.value)}
              >
                <option value="">All SBUs</option>
                {sbuOptions.map((sbu) => (
                  <option key={sbu} value={sbu}>{sbu}</option>
                ))}
              </select>
            </div>
            <div className="col-2 mt-3">
              <select
                className="form-select"
                style={{ fontSize: "13px" }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
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

        {!loading && error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="table-responsive" style={{ maxHeight: "65vh", overflowY: "auto" }}>
            <table className="table table-bordered table-hover table-striped align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: "60px", position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f8f9fa" }}>#</th>
                  <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f8f9fa" }}>BU</th>
                  <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f8f9fa" }}>SBU</th>
                  <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f8f9fa" }}>Program / Project</th>
                  <th style={{ minWidth: "350px", position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f8f9fa" }}>Description</th>
                  <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f8f9fa" }}>Status</th>
                  <th className="text-center" style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f8f9fa" }}>Employees</th>
                  <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f8f9fa" }}>Line Managers</th>
                </tr>
              </thead>

              <tbody>
                {filteredPrograms.length > 0 ? (
                  filteredPrograms.map((item, index) => (
                    <tr
                      key={`${item.bu}-${item.sbu}-${item.projectName}-${index}`}
                      ref={item.projectName === highlightProgram ? highlightedRowRef : null}
                      style={
                        item.projectName === highlightProgram
                          ? { backgroundColor: "#fff3cd", transition: "background-color 0.5s" }
                          : {}
                      }
                    >
                      <td>{index + 1}</td>
                      <td>{item.bu}</td>
                      <td>{item.sbu}</td>
                      <td className="fw-semibold">{item.projectName}</td>
                      <td style={{ maxWidth: "300px" }}>
                        <div style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}>
                          {item.description}
                        </div>
                        {item.description && (
                          <span
                            style={{ color: "#0d6efd", cursor: "pointer", fontSize: "12px" }}
                            onClick={() => {
                              setSelectedDesc({ title: item.projectName, text: item.description });
                              setShowDescPopup(true);
                            }}
                          >
                            Read More
                          </span>
                        )}
                      </td>

                      <td>
                        {item.isActive
                          ? <span className="badge bg-success">Active</span>
                          : <span className="badge bg-danger">Inactive</span>}
                      </td>

                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-link p-0 fw-bold text-decoration-none"
                          onClick={() => openEmployeePopup(item)}
                        >
                          {item.employees.length}
                        </button>
                      </td>

                      <td>
                        {item.lineManagers.length > 0
                          ? item.lineManagers.join(", ")
                          : "NA"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      No Records Found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {showEmployees && (
          <div
            className="modal fade show"
            style={{
              display: "block",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            }}
            tabIndex="-1"
          >
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {selectedProgram} - Employees
                  </h5>

                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeEmployeePopup}
                  ></button>
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
                          <tr>
                            <td colSpan="6" className="text-center py-4">
                              No Employees Found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeEmployeePopup}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showDescPopup && (
        <div
          style={{
            position: "fixed",
            top: 0, left: 0,
            width: "100%", height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
          onClick={() => setShowDescPopup(false)}
        >
          <div
            style={{
              background: "#fff",
              width: "520px",
              maxWidth: "90%",
              padding: "24px",
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h5 className="fw-bold mb-3">{selectedDesc.title}</h5>
            <hr />
            <p style={{ whiteSpace: "pre-line", lineHeight: "1.7" }}>{selectedDesc.text}</p>
            <div className="text-end mt-3">
              <button
                className="btn btn-primary"
                onClick={() => setShowDescPopup(false)}
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

export default ProjectProgramPage;
