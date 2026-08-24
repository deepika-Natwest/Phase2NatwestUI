import React from "react";
import { ROLES } from "../../constants/roles";
import { hasAnyRole } from "../../utils/roleUtils";

function UserList({ users, role, onEdit, onDelete }) {
  return (
    <table className="table table-bordered">
      <thead>
        <tr>
          <th>Name</th>
          <th>Enterprise ID</th>
          <th>Capability</th>
          <th>Franchise</th>
          <th>Status</th>
          <th width="150">Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u.id}>
            <td>{u.name}</td>
            <td>{u.enterpriseId}</td>
            <td>{u.capability}</td>
            <td>{u.franchise}</td>
            <td>{u.status}</td>
            <td>
              {hasAnyRole(role, [ROLES.ADMIN]) && (
                <>
                  <button
                    className="btn btn-sm btn-warning me-2"
                    onClick={() => onEdit(u)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => onDelete(u.id)}
                  >
                    Delete
                  </button>
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default UserList;