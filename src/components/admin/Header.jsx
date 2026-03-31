import React from "react";

function Header({ username, onLogout }) {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark px-4 adminHeader">
      <a className="navbar-brand" href="#">
        NatWest Admin
      </a>
      <div className="ms-auto d-flex align-items-center">
        <span className="text-white me-3">Hello, {username}</span>
        <button className="btn btn-outline-light btn-sm" onClick={onLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Header;
