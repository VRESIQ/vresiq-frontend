import { Link } from "react-router-dom";
import NavLogo from "../components/NavLogo";
import "./Legal.css";
import "./Pricing.css";

const Suspended = () => {
  return (
    <div className="legal-page premium-shell">
      <nav className="pricing-nav">
        <NavLogo className="pricing-logo" />
        <div className="pricing-nav-links">
          <Link to="/" className="btn-back">Home</Link>
        </div>
      </nav>

      <div className="legal-content" style={{ marginTop: "10vh" }}>
        <div className="legal-card" style={{ textAlign: "center", borderColor: "rgba(186, 43, 43, 0.4)" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ba2b2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <h1 style={{ fontSize: "2rem", color: "#ffffff", marginBottom: "1rem" }}>Account Suspended</h1>
          <p style={{ fontSize: "1.1rem", lineHeight: "1.6", color: "#ffffff", opacity: 0.9, marginBottom: "2rem" }}>
            Your account has been temporarily suspended by an administrator.<br />
            Please contact support for assistance.
          </p>
          <a href="mailto:support@vresiq.com" className="btn-create" style={{ display: "inline-block", padding: "0.75rem 2rem", textDecoration: "none", backgroundColor: "#ba2b2b", color: "#ffffff", border: "none" }}>
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};

export default Suspended;
