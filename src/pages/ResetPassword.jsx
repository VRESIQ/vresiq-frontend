import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../api";
import "./Auth.css";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [strength, setStrength] = useState({ label: "", score: 0 }); // score: 0-3

  // Password strength calculation logic
  useEffect(() => {
    if (!password) {
      setStrength({ label: "", score: 0 });
      return;
    }

    const len = password.length;
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasDigits = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);

    if (len < 6) {
      setStrength({ label: "weak", score: 1 });
    } else if (hasLetters && hasDigits && hasSpecial && len >= 8) {
      setStrength({ label: "strong", score: 3 });
    } else if (hasLetters && hasDigits && len >= 6) {
      setStrength({ label: "medium", score: 2 });
    } else {
      setStrength({ label: "weak", score: 1 });
    }
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Reset token is missing in the URL. Please request a new reset link.");
      return;
    }

    if (strength.score < 2) {
      setError("Please choose a stronger password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await resetPassword(token, password);
      setSuccess(res.data.message || "Password reset successful.");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || "Failed to reset password.";
      setError(typeof msg === "string" ? msg : "Reset link is invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColorClass = (index) => {
    if (strength.score >= index) {
      return strength.label; // weak, medium, strong
    }
    return "";
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo">
          <span className="logo-v">V</span>
          <span className="logo-res">RES</span>
          <span className="logo-iq">IQ</span>
        </Link>
        <h1 className="auth-title">Choose new password</h1>
        <p className="auth-sub">Choose a secure password. Your active sessions will be signed out for safety.</p>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        {!token && (
          <div className="auth-error">
            Reset token is missing. Please click the reset link sent to your email or request a new one.
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label>New Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
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
            {password && (
              <div className="password-strength-wrap">
                <div className="password-strength-bar-container">
                  <div className={`password-strength-bar ${getStrengthColorClass(1)}`} />
                  <div className={`password-strength-bar ${getStrengthColorClass(2)}`} />
                  <div className={`password-strength-bar ${getStrengthColorClass(3)}`} />
                </div>
                <span className="password-strength-text">
                  Password strength: <strong>{strength.label}</strong>
                </span>
              </div>
            )}
          </div>

          <div className="field">
            <label>Confirm Password</label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label="Toggle password visibility"
              >
                {showConfirmPassword ? (
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
            {confirmPassword && password !== confirmPassword && (
              <span className="text-error" style={{ fontSize: "0.78rem", marginTop: "0.25rem", display: "block" }}>
                Passwords do not match.
              </span>
            )}
          </div>

          <button
            type="submit"
            className="auth-btn"
            disabled={loading || !password || password !== confirmPassword || strength.score < 2}
          >
            {loading ? "Resetting password..." : "Reset password"}
          </button>
        </form>

        <p className="auth-footer">
          Back to <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
