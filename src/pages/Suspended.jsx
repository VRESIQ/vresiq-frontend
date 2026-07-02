import { Link } from "react-router-dom";
import NavLogo from "../components/NavLogo";
import { SUPPORT_EMAIL } from "../constants/config";
import "./Legal.css";
import "./Pricing.css";

const Suspended = () => {
  const subject = encodeURIComponent("Suspended Account Assistance");
  const body = encodeURIComponent(
    "- Name:\n" +
    "- Registered Email:\n" +
    "- Issue: Account Suspension Inquiry\n" +
    "- Additional Details:\n"
  );
  const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;

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

          <a
            href={mailtoUrl}
            className="btn-create"
            style={{
              display: "inline-block",
              padding: "0.75rem 2rem",
              textDecoration: "none",
              backgroundColor: "#ba2b2b",
              color: "#ffffff",
              border: "none",
              cursor: "pointer",
              marginBottom: "1.8rem"
            }}
          >
            Contact Support
          </a>

          <div
            className="manual-contact-card"
            style={{
              fontSize: "0.92rem",
              lineHeight: "1.5",
              color: "rgba(255, 255, 255, 0.75)",
              padding: "1rem",
              borderRadius: "6px",
              border: "1px dashed rgba(255, 255, 255, 0.15)",
              background: "rgba(255, 255, 255, 0.02)",
              maxWidth: "320px",
              margin: "0 auto"
            }}
          >
            <span style={{ display: "block", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.8, marginBottom: "0.4rem" }}>
              Need Help?
            </span>
            Email:
            <br />
            <strong style={{ color: "var(--accent, #648c00)", fontSize: "1.05rem" }}>{SUPPORT_EMAIL}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Suspended;
