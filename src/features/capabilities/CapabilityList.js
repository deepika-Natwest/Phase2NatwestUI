import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getCapabilities,
  deleteCapability,
} from "./capabilityService";
import { ROLES } from "../../constants/roles";
import { hasAnyRole } from "../../utils/roleUtils";

function CapabilityList({ role }) {
  const [capabilities, setCapabilities] = useState([]);

  const loadData = async () => {
    const res = await getCapabilities();
    setCapabilities(res.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Delete this capability?")) {
      await deleteCapability(id);
      loadData();
    }
  };

  return (
    <div>
      {hasAnyRole(role, [ROLES.ADMIN]) && (
        <Link
          to="/admin/capabilities/add"
          className="btn btn-primary mb-3"
        >
          Add Capability
        </Link>
      )}

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Name</th>
            <th width="150">Actions</th>
          </tr>
        </thead>
        <tbody>
          {capabilities.map((cap) => (
            <tr key={cap.id}>
              <td>{cap.name}</td>
              <td>
                {hasAnyRole(role, [ROLES.ADMIN, ROLES.EDITOR]) && (
                  <Link
                    to={`/admin/capabilities/edit/${cap.id}`}
                    className="btn btn-sm btn-warning me-2"
                  >
                    Edit
                  </Link>
                )}

                {hasAnyRole(role, [ROLES.ADMIN]) && (
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(cap.id)}
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CapabilityList;