import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, resendVerification } from "../api";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

const Login = () => {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState("");

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResendStatus("");
    setLoading(true);

    try {
      const payload = {
        email: (form.email || "").trim().toLowerCase(),
        password: form.password || "",
      };
      const res = await login(payload);
      loginUser(res.data);
      navigate("/dashboard");
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.response?.data?.error;
      const networkMsg = err.request && !err.response
        ? "Cannot reach server. Check backend connection and VITE_API_BASE_URL."
        : null;
      setError(serverMsg || networkMsg || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendStatus("Sending...");
    try {
      await resendVerification(form.email);
      setResendStatus("Verification email sent. Check your inbox.");
    } catch (err) {
      setResendStatus(err.response?.data?.message || "Failed to resend email.");
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
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Sign in to continue building your resume workspace.</p>

        {window.location.search.includes("expired=1") && (
          <div className="auth-note" style={{ background: "rgba(240, 165, 0, 0.12)", border: "1px solid rgba(240, 165, 0, 0.35)", color: "#d97706" }}>
            Your session has expired. Please log in again to continue.
          </div>
        )}

        {error && (
          <div className="auth-error" style={{ display: "grid", gap: "8px" }}>
            <span>{error}</span>
            {error.toLowerCase().includes("verify your email") && (
              <span>
                Didn't receive it?{" "}
                <button type="button" onClick={handleResend} className="auth-inline-button">
                  Resend verification email
                </button>
              </span>
            )}
          </div>
        )}

        {resendStatus && (
          <div className={`auth-note ${resendStatus.includes("sent") ? "success" : "error"}`}>
            {resendStatus}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              name="password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
            />
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Signing in" : "Sign in"}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
