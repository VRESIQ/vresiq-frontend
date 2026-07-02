import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NavLogo from "../components/NavLogo";
import "./Legal.css";
import "./Pricing.css";

const Terms = () => {
  const { user } = useAuth();

  return (
    <div className="legal-page premium-shell">
      <nav className="pricing-nav">
        <NavLogo className="pricing-logo" />
        <div className="pricing-nav-links">
          <Link to="/" className="btn-back">Home</Link>
          <Link to={user ? "/dashboard" : "/login"} className="btn-back">
            {user ? "Dashboard" : "Sign in"}
          </Link>
        </div>
      </nav>

      <div className="legal-content">
        <div className="legal-card">
          <h1>Terms of Service</h1>
          <span className="legal-meta">Last Updated: July 2, 2026</span>

          <div className="legal-section">
            <h2>1. Acceptable Use</h2>
            <p>You agree to use VResIQ solely for legal purposes related to resume design, career preparation, and job applications. You must not upload malicious files, profile photos containing inappropriate material, or attempt to compromise VResIQ's infrastructure.</p>
          </div>

          <div className="legal-section">
            <h2>2. Premium Subscriptions</h2>
            <p>VResIQ offers a Premium subscription upgrade. By purchasing a Premium subscription, you agree to the payment of transaction charges handled via Razorpay. Premium benefits, templates, and priority PDF capabilities are active immediately upon successful processing. Subscription payments are final and subject to our refund policies.</p>
          </div>

          <div className="legal-section">
            <h2>3. User Responsibilities</h2>
            <p>You are solely responsible for maintaining the confidentiality of your credentials (including your password and session tokens) and for all activities that occur under your account. You represent and warrant that the information you input into your resumes is accurate and belongs to you.</p>
          </div>

          <div className="legal-section">
            <h2>4. Disclaimer</h2>
            <p>VResIQ is provided "as is" and "as available". We make no warranties, express or implied, regarding the application's uptime, availability, or suitability for any specific career outcomes or employment opportunities.</p>
          </div>

          <div className="legal-section">
            <h2>5. Contact Information</h2>
            <p>For any inquiries regarding VResIQ's Terms of Service, please contact us at:</p>
            <p style={{ marginTop: "0.5rem" }}>
              Email: <a href="mailto:vresiq.app@gmail.com" style={{ color: "var(--accent)", textDecoration: "underline" }}>vresiq.app@gmail.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
