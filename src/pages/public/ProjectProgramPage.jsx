import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import api from "../../services/api";

function ProjectProgramPage() {
  const [users, setUsers] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [selectedBU, setSelectedBU] = useState("");
  const [selectedSBU, setSelectedSBU] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showEmployees, setShowEmployees] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [programSearch, setProgramSearch] = useState("");

  const [searchParams] = useSearchParams();
  const highlightProgram = searchParams.get("highlight");
  const highlightRef = useRef(null);

  useEffect(() => {
    Promise.all([fetchUsers(), api.get("/programs")])
      .then(([, programsResponse]) => setPrograms(Array.isArray(programsResponse.data) ? programsResponse.data : []))
      .catch((err) => console.error("Error fetching programs:", err));
  }, []);

  useEffect(() => {
    if (highlightProgram && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightProgram, projectRows]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/users");

      const backendData =
        response.data?.users ||
        response.data?.data ||
        response.data?.content ||
        response.data ||
        [];

      setUsers(Array.isArray(backendData) ? backendData : []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load project/program data.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getBU = (user) => {
    return (
      user.bu ||
      user.businessUnit ||
      user.franchise ||
      user.franchiseName ||
      user.franchiseId ||
      "NA"
    );
  };

  const getSBU = (user) => {
    return (
      user.sbu ||
      user.subBusinessUnit ||
      user.capability ||
      user.capabilityName ||
      user.capabilityId ||
      "NA"
    );
  };

  const getProjectName = (user) => {
    return (
      user.projectName ||
      user.project ||
      user.programName ||
      user.program ||
      user.projectProgram ||
      "NA"
    );
  };

  const getEmployeeName = (user) => {
    return (
      user.name ||
      user.employeeName ||
      user.fullName ||
      user.employeeFullName ||
      user.userName ||
      "NA"
    );
  };

  const getEnterpriseId = (user) => {
    return user.enterpriseId || user.enterpriseID || user.eid || user.email || "NA";
  };

  const getCareerLevel = (user) => {
    return user.careerLevel || user.level || user.jobLevel || "NA";
  };

  const getLocation = (user) => {
    return user.location || user.baseLocation || user.officeLocation || "NA";
  };

  const getLineManager = (user) => {
    return (
      user.lineManager ||
      user.nwgLineManager ||
      user.manager ||
      user.peopleLead ||
      user.supervisor ||
      "NA"
    );
  };

  const programDescriptions = useMemo(() => Object.fromEntries(
    programs.map((program) => [program.name, program.description])
  ), [programs]);

  const projectRows = useMemo(() => {
    const grouped = {};

    users.forEach((user) => {
      const bu = getBU(user);
      const sbu = getSBU(user);
      const projectName = getProjectName(user);
      const key = `${bu}__${sbu}__${projectName}`;

      if (!grouped[key]) {
        grouped[key] = {
          bu,
          sbu,
          projectName,
          description:
            programDescriptions[projectName] ||
            user.description ||
            user.projectDescription ||
            "Project description will be updated soon.",
          employees: [],
          lineManagers: [],
        };
      }

      grouped[key].employees.push(user);

      const manager = getLineManager(user);
      if (manager && manager !== "NA" && !grouped[key].lineManagers.includes(manager)) {
        grouped[key].lineManagers.push(manager);
      }
    });

    return Object.values(grouped);
  }, [users, programDescriptions]);

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
      const buMatch = selectedBU ? item.bu === selectedBU : true;
      const sbuMatch = selectedSBU ? item.sbu === selectedSBU : true;
      return buMatch && sbuMatch;
    });
  }, [projectRows, selectedBU, selectedSBU]);

  const displayedRows = useMemo(() => {
    if (!programSearch) return filteredPrograms;
    const query = programSearch.toLowerCase();
    return filteredPrograms.filter((item) =>
      item.projectName?.toLowerCase().includes(query)
    );
  }, [filteredPrograms, programSearch]);

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

      <div className="container my-4">
        <div className="d-flex justify-content-between align-items-center mb-4 teamHeading">
          <div className="d-flex align-items-center">
            <span className="recog-main-side-line trophy-emoji">👥</span>
            <span className="recog-main-title ms-2">Project / Programs</span>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-md-3 mb-2">
            <label className="form-label fw-bold">Business Unit</label>
            <select
              className="form-select"
              value={selectedBU}
              onChange={handleBUChange}
            >
              <option value="">All BUs</option>
              {buOptions.map((bu) => (
                <option key={bu} value={bu}>
                  {bu}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-3 mb-2">
            <label className="form-label fw-bold">Sub Business Unit</label>
            <select
              className="form-select"
              value={selectedSBU}
              onChange={(e) => setSelectedSBU(e.target.value)}
            >
              <option value="">All SBUs</option>
              {sbuOptions.map((sbu) => (
                <option key={sbu} value={sbu}>
                  {sbu}
                </option>
              ))}
            </select>
          </div>
        </div>

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
          <>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Search by program name..."
                style={{ maxWidth: "300px" }}
                value={programSearch}
                onChange={(e) => setProgramSearch(e.target.value)}
              />
            </div>

            <div className="table-responsive">
              <table className="table table-bordered table-hover table-striped align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "60px" }}>#</th>
                    <th>BU</th>
                    <th>SBU</th>
                    <th>Program / Project</th>
                    <th style={{ minWidth: "350px" }}>Description</th>
                    <th className="text-center">Employees</th>
                    <th>Line Managers</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedRows.length > 0 ? (
                    displayedRows.map((item, index) => {
                      const isHighlighted =
                        highlightProgram &&
                        item.projectName?.toLowerCase() === highlightProgram.toLowerCase();
                      return (
                        <tr
                          key={`${item.bu}-${item.sbu}-${item.projectName}-${index}`}
                          ref={isHighlighted ? highlightRef : null}
                          style={
                            isHighlighted
                              ? { backgroundColor: "#fff3cd", outline: "2px solid #ffc107" }
                              : undefined
                          }
                        >
                          <td>{index + 1}</td>
                          <td>{item.bu}</td>
                          <td>{item.sbu}</td>
                          <td className="fw-semibold">{item.projectName}</td>
                          <td>{item.description}</td>

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
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-4">
                        No Records Found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
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

      <Footer />
    </>
  );
}

export default ProjectProgramPage;
