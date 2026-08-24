// src/components/Footer.jsx
import React from "react";

function Footer() {
  return (
    <footer className="footerBg">
      <div className="footerInner">
        <div className="footerDivider" />
        <div className="footerContent">
          <span className="footerCopy">
            &copy; Built &amp; managed by the <strong>NatWest Accenture Team</strong>. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
