// src/components/Footer.jsx
import React from "react";

function Footer() {
  return (
    <footer className="text-center py-3 mt-4 footerBg">
      <div className="container">
        <p className="mb-0">
          &copy; {new Date().getFullYear()} West-Info. All rights reserved.
        </p>
        <p className="mb-0">
          Designed and managed by West-Info Team.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
