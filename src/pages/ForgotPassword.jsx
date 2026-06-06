import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api";
import "./Auth.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const normalizedEmail = (email || "").trim().toLowerCase();
      const res = await forgotPassword(normalizedEmail);
      setSuccess(res.data.message || "Password reset link sent to your email.");
      setEmail("");
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || "Failed to process request.";
      setError(typeof msg === "string" ? msg : "Failed to request password reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo">
          <span className="logo-v">V</span>
          <span className="logo-res">RES</span>
          <span className="logo-iq">IQ</span>
        </Link>
        <h1 className="auth-title">Reset password</h1>
        <p className="auth-sub">Enter your email and we'll send you a link to choose a new password.</p>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label>Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Sending link..." : "Send reset link"}
          </button>
        </form>

        <p className="auth-footer">
          Back to <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
