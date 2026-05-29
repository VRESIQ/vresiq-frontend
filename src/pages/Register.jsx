import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api";
import { sanitizeStrictText } from "../utils/inputSanitizers";
import "./Auth.css";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const nextValue = e.target.name === "name"
      ? sanitizeStrictText(e.target.value)
      : e.target.value;
    setForm((prev) => ({ ...prev, [e.target.name]: nextValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await register(form);
      setSuccess("Account created. Verify your email, then sign in.");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || "Registration failed.";
      setError(err.response?.status === 409 ? "Email already exists" : typeof msg === "string" ? msg : "Registration failed.");
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
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-sub">Start with one resume. Upgrade only when you need more room.</p>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label>Full name</label>
            <input
              type="text"
              name="name"
              required
              minLength={2}
              maxLength={15}
              value={form.name}
              onChange={handleChange}
              placeholder="Arjun Kapoor"
            />
          </div>
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
              minLength={6}
              maxLength={15}
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 6 characters"
            />
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Creating account" : "Create account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
