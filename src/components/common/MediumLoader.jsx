import React from "react";
import "./MediumLoader.css";

const MediumLoader = ({ statusText = "" }) => {
  return (
    <div className="medium-loader-container">
      <div className="medium-loader-card">
        <div className="nav-logo" style={{ fontSize: "1.4rem", pointerEvents: "none", textDecoration: "none" }}>
          <span className="logo-v">V</span>
          <span className="logo-res">RES</span>
          <span className="logo-iq">IQ</span>
        </div>
        <div className="spinner-small" />
        {statusText && <p className="medium-loader-text">{statusText}</p>}
      </div>
    </div>
  );
};

export default MediumLoader;
