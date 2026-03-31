import React, { useEffect, useState } from "react";
import api from "../../services/api";
import UserForm from "../../features/users/UserForm";
import Layout from "../../components/admin/Layout";

const UserPage = () => {
  const [users, setUsers] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const fetchUsers = async () => {
    const res = await api.get("/users");
    setUsers(res.data);
  };

  useEffect(() => {
    fetchUsers();
    api.get("/franchises").then(res => setFranchises(res.data));
  }, []);

  const handleSearch = (e) => setSearch(e.target.value);

    const getFranchiseName = (id) => {
    const f = franchises.find(f => f.id === id);
    return f ? f.name : "";
  };
const filteredUsers = users.filter(u => 
  (u.name || "").toLowerCase().includes(search.toLowerCase())
);

  return (
    <Layout>
        <div className="d-flex justify-content-between align-items-center titleBox">
        <h2>Users Manager</h2>
      </div>
       <div className="searchHeadBox p-3">
                <div className="row">
                    <div className="col-4"><input type="text" className="form-control " placeholder="Search by name" value={search} onChange={handleSearch}/></div>
                    <div className="col-4"></div>
                    <div className="col-4 text-end"><button className="btn btn-success" onClick={() => { setEditUser(null); setShowModal(true); }}>Add User</button>
                    </div>
                </div>
            </div>
    <div className="container mt-4">
  

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Name</th>
            <th>Enterprise ID</th>
            <th>Role</th>
            <th>Franchise</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map(u => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.enterpriseId}</td>
              <td>{u.role}</td>
               <td>{getFranchiseName(u.franchiseId)}</td>
              <td>{u.status}</td>
              <td>
                <button className="btn btn-primary btn-sm me-1" onClick={() => { setEditUser(u); setShowModal(true); }}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={async () => { await api.delete(`/users/${u.id}`); fetchUsers(); }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && <UserForm onClose={() => { setShowModal(false); fetchUsers(); }} user={editUser} />}
    </div>
    </Layout>
  );
};

export default UserPage;