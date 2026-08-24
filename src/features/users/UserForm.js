import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { LOCATION_OPTIONS, GENDER_OPTIONS } from "../../utils/userConfig";

const UserForm = ({ user, onClose }) => {
  const [capabilities, setCapabilities] = useState([]);
  const [allFranchises, setAllFranchises] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [userStatuses, setUserStatuses] = useState([]);
  const [form, setForm] = useState({
    capabilityId: "",
    franchiseId: "",
    name: "",
    enterpriseId: "",
    password: "",
    gender: "",
    location: "",
    careerLevel: "",
    lineManager: "",
    projectName: "",
    role: "",
    status: "",
    profilePic: null,
    shortDescription: "",
    resourceType: "",
    natwestDoj: "",
    sowStartDate: "",
    sowEndDate: "",
    sowId: "",
  });

  const roles = ["admin", "viewer", "editor"];
  const careerLevels = Array.from({ length: 12 }, (_, i) => `Level ${i + 1}`);
  const statuses = ["Active", "Inactive"];

  // Fetch capabilities, all franchises, and user statuses once on mount
  useEffect(() => {
    api.get("/capabilities").then(res => setCapabilities(Array.isArray(res.data) ? res.data : []));
    api.get("/franchises").then(res => {
      const list = Array.isArray(res.data) ? res.data : res.data?.franchises || [];
      setAllFranchises(list);
    });
    api.get("/user-statuses").then(res => setUserStatuses(res.data)).catch(() => {});
  }, []);

  // When editing, filter franchises for the existing capabilityId
  useEffect(() => {
    if (user) {
      setForm({ ...user, password: "" });
    }
  }, [user]);

  // Keep franchise list in sync with selected capability (client-side filter — no extra API call)
  useEffect(() => {
    if (form.capabilityId) {
      setFranchises(allFranchises.filter(f => f.capabilityId === form.capabilityId));
    } else {
      setFranchises(allFranchises);
    }
  }, [form.capabilityId, allFranchises]);

  const handleCapabilityChange = (e) => {
    const capabilityId = e.target.value;
    setForm({ ...form, capabilityId, franchiseId: "" });
    // franchise list updates automatically via the useEffect above
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm({ ...form, [name]: files ? files[0] : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(form).forEach(key => {
      if (form[key] !== null && form[key] !== "") {
        formData.append(key, form[key]);
      }
    });

    try {
      if (user) {
        await api.put(`/users/${user.id}`, formData);
      } else {
        await api.post("/users", formData);
      }
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{user ? "Edit User" : "Add User"}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              
              {/* Capability */}
              <div className="mb-3">
                <label>Capability</label>
                <select
                  name="capabilityId"
                  className="form-control"
                  value={form.capabilityId}
                  onChange={handleCapabilityChange}
                  required
                >
                  <option value="">Select Capability</option>
                  {capabilities.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Franchise */}
              <div className="mb-3">
                <label>Franchise</label>
                <select
                  name="franchiseId"
                  className="form-select"
                  value={form.franchiseId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Franchise</option>
                  {franchises.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              {/* Name & Enterprise ID */}
              <div className="row">
                <div className="mb-3 col">
                  <label>Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3 col">
                  <label>Enterprise ID</label>
                  <input
                    type="text"
                    className="form-control"
                    name="enterpriseId"
                    value={form.enterpriseId}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="mb-3">
                <label>Password</label>
                <input
                  type="password"
                  className="form-control"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={user ? "Leave blank to keep current password" : ""}
                  required={!user}
                />
              </div>

              {/* Gender & Location */}
              <div className="row">
                <div className="mb-3 col">
                  <label>Gender</label>
                  <select
                  name="gender"
                  className="form-control"
                  value={form.gender}
                  onChange={handleChange}
                  
                >
                  <option value="">Select Gender</option>
                  {GENDER_OPTIONS.map((loc) => (
                    <option key={loc}>{loc}</option>
                  ))}
                </select>
                </div>
                <div className="mb-3 col">
                  <label>Location</label>
                   <label className="form-label">Location</label>
                <select
                  name="location"
                  className="form-control"
                  value={form.location}
                  onChange={handleChange}
                  
                >
                  <option value="">Select Location</option>
                  {LOCATION_OPTIONS.map((loc) => (
                    <option key={loc}>{loc}</option>
                  ))}
                </select>
                </div>
              </div>

              {/* Career Level & Line Manager */}
              <div className="row">
                <div className="mb-3 col">
                  <label>Career Level</label>
                  <select
                    name="careerLevel"
                    className="form-control"
                    value={form.careerLevel}
                    onChange={handleChange}
                  >
                    <option value="">Select Level</option>
                    {careerLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3 col">
                  <label>Line Manager</label>
                  <input
                    type="text"
                    className="form-control"
                    name="lineManager"
                    value={form.lineManager}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Project Name */}
              <div className="mb-3">
                <label>Project Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="projectName"
                  value={form.projectName}
                  onChange={handleChange}
                />
              </div>

              {/* Role & Status */}
              <div className="row">
                <div className="mb-3 col">
                  <label>Role</label>
                  <select
                    name="role"
                    className="form-control"
                    value={form.role}
                    onChange={handleChange}
                  >
                    <option value="">Select Role</option>
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="mb-3 col">
                  <label>Status</label>
                  <select
                    name="status"
                    className="form-control"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option value="">Select Status</option>
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Profile Pic */}
              <div className="mb-3">
                <label>Profile Pic</label>
                <input
                  type="file"
                  className="form-control"
                  name="profilePic"
                  onChange={handleChange}
                />
              </div>

              {/* Short Description */}
              <div className="mb-3">
                <label>Short Description</label>
                <textarea
                  className="form-control"
                  name="shortDescription"
                  value={form.shortDescription}
                  onChange={handleChange}
                />
              </div>

              <div className="row">
                {/* Resource Type */}
                <div className="col-md-6 mb-3">
                  <label>Resource Type</label>
                  <select name="resourceType" className="form-control" value={form.resourceType} onChange={handleChange}>
                    <option value="">Select</option>
                    {userStatuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>

                {/* NatWest DOJ */}
                <div className="col-md-6 mb-3">
                  <label>NatWest DOJ</label>
                  <input type="date" name="natwestDoj" className="form-control" value={form.natwestDoj || ""} onChange={handleChange} />
                </div>

                {/* SOW ID */}
                <div className="col-md-6 mb-3">
                  <label>SOW ID</label>
                  <input type="text" name="sowId" className="form-control" value={form.sowId || ""} onChange={handleChange} />
                </div>

                {/* SOW Start Date */}
                <div className="col-md-6 mb-3">
                  <label>SOW Start Date</label>
                  <input type="date" name="sowStartDate" className="form-control" value={form.sowStartDate || ""} onChange={handleChange} />
                </div>

                {/* SOW End Date */}
                <div className="col-md-6 mb-3">
                  <label>SOW End Date</label>
                  <input type="date" name="sowEndDate" className="form-control" value={form.sowEndDate || ""} onChange={handleChange} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary">
                {user ? "Update" : "Add"} User
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserForm;