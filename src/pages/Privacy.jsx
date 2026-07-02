import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NavLogo from "../components/NavLogo";
import "./Legal.css";
import "./Pricing.css";

const Privacy = () => {
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
          <h1>Privacy Policy</h1>
          <span className="legal-meta">Last Updated: July 2, 2026</span>

          <div className="legal-section">
            <h2>1. Information We Collect</h2>
            <p>We collect information you provide directly to us when creating a VResIQ account and editing your resume profile, including:</p>
            <ul>
              <li><strong>Account Credentials:</strong> Email address and password (when registering locally).</li>
              <li><strong>Google OAuth Data:</strong> When you sign in using Google, we collect your name, email address, and profile picture url as authorized by Google's OAuth consent scope.</li>
              <li><strong>Resume Data:</strong> Any information you enter into your resume sheets, such as full name, professional title, contact info, employment history, education, skills, and projects.</li>
              <li><strong>Payment Metadata:</strong> Transaction metadata related to payment upgrades. VResIQ does not store credit card or payment credential information; all checkout procedures are handled securely by Razorpay.</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>2. How We Use Information</h2>
            <p>We use your information solely to deliver the resume building services, export PDFs, process subscription upgrades, verify user credentials, and send transactional email notifications (such as registration verifications and Premium upgrade confirmation emails).</p>
          </div>

          <div className="legal-section">
            <h2>3. Third-Party Services</h2>
            <p>VResIQ works with the following service providers to store data, facilitate secure logins, process payments, and send emails:</p>
            <ul>
              <li><strong>Google OAuth 2.0:</strong> Authenticational federations.</li>
              <li><strong>Razorpay:</strong> Premium subscription payments and webhook verifications.</li>
              <li><strong>MongoDB Atlas:</strong> Secure cloud database storage.</li>
              <li><strong>Cloudinary:</strong> Image upload hosting for profile photos.</li>
              <li><strong>Brevo:</strong> Transactional SMTP email delivery.</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>4. Data Retention & Security</h2>
            <p>We retain your account data and resume designs for as long as your account remains active. You can request deletion of your account and related resume records at any time by contacting our support email.</p>
          </div>

          <div className="legal-section">
            <h2>5. Contact Information</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at:</p>
            <p style={{ marginTop: "0.5rem" }}>
              Email: <a href="mailto:vresiq.app@gmail.com" style={{ color: "var(--accent)", textDecoration: "underline" }}>vresiq.app@gmail.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
