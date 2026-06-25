import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, resendVerification, getProfile } from "../api";
import { useAuth } from "../context/AuthContext";
import SocialAuth from "../components/SocialAuth";
import "./Auth.css";

const Login = () => {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const refreshToken = params.get("refreshToken");
    const errorParam = params.get("error");

    if (errorParam) {
      setError(errorParam);
    } else if (token && refreshToken) {
      setLoading(true);
      sessionStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refreshToken);
      getProfile()
        .then((res) => {
          loginUser({ ...res.data, token, refreshToken });
          navigate("/dashboard");
        })
        .catch((err) => {
          console.error(err);
          setError("OAuth login failed during profile retrieval.");
          sessionStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [navigate, loginUser]);

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

        <SocialAuth onError={setError} />

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
            <div className="field-header">
              <label>Password</label>
              <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
            </div>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24">
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.82l2.92 2.92C21.27 15.39 22.27 13.8 23 12c-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.72-4.72l2 2c.04.14.07.28.07.42 0 1.66-1.34 3-3 3-.14 0-.28-.03-.42-.07l-2-2c.6-.6 1.4-1.35 2.42-1.35z"/>
                  </svg>
                )}
              </button>
            </div>
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
