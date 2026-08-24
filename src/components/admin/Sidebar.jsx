import React from "react";
import { NavLink } from "react-router-dom";
import { getImageUrl } from "../../services/imageHelper";
import { ROLES } from "../../constants/roles";
import { hasAnyRole } from "../../utils/roleUtils";

function Sidebar() {
  const role = (localStorage.getItem("role") || "").toUpperCase();

  return (
    <div className="border-end sideBar" style={{ width: "220px", minHeight: "100vh" }}>
      <h3 className="brandLogo">
        <img src={getImageUrl("siteLogo.png")} alt="Natwest" />
      </h3>
      <div className="list-group list-group-flush">
        <NavLink to="/admin/dashboard" className="list-group-item list-group-item-action">
          Dashboard
        </NavLink>




        {hasAnyRole(role, [ROLES.ADMIN, ROLES.EDITOR]) && (
          <NavLink to="/admin/capabilities" className="list-group-item list-group-item-action">
            Capabilities
          </NavLink>
        )}
 {hasAnyRole(role, [ROLES.ADMIN, ROLES.EDITOR]) && (
          <NavLink to="/admin/programs" className="list-group-item list-group-item-action">
            Program
          </NavLink>
        )}

        {hasAnyRole(role, [ROLES.ADMIN, ROLES.EDITOR]) && (
          <NavLink to="/admin/franchises" className="list-group-item list-group-item-action">
            Franchises
          </NavLink>
        )}

        {role === ROLES.ADMIN && (
          <NavLink to="/admin/users" className="list-group-item list-group-item-action">
            Manage Users
          </NavLink>
        )}

        {hasAnyRole(role, [ROLES.ADMIN]) && (
          <NavLink to="/admin/user-status" className={({ isActive }) => isActive ? "active" : ""}>
            User Status
          </NavLink>
        )}

        {hasAnyRole(role, [ROLES.ADMIN, ROLES.EDITOR, ROLES.VIEWER]) && (
          <>
          <NavLink to="/admin/deliverables" className="list-group-item list-group-item-action">
              Deliverables
            </NavLink>
            <NavLink to="/admin/leadership" className="list-group-item list-group-item-action">
              Leadership
            </NavLink>
            <NavLink to="/admin/events" className="list-group-item list-group-item-action">
              Events
            </NavLink>
             <NavLink to="/admin/recognition" className="list-group-item list-group-item-action">
              Recognitions
            </NavLink>
          </>
        )}
        <NavLink to="/admin/upload-users" className="list-group-item list-group-item-action">
          Upload Users
        </NavLink>
      </div>
    </div>
  );
}

export default Sidebar;