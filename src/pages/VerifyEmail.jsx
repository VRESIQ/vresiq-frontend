import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyEmail, resendVerification } from "../api";
import "./Auth.css";

// Global browser-session cache to prevent StrictMode double-triggers from showing "already verified" on first successful load
const verificationCache = {};

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const [status, setStatus] = useState("verifying");
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  useEffect(() => {
    const token = params.get("token");
    const email = params.get("email") || "";

    if (!token) {
      setStatus("invalid");
      return;
    }

    // If already verified in this session, immediately render success
    if (verificationCache[token] === "verified") {
      setStatus("success");
      return;
    }

    verifyEmail(token, email)
      .then((res) => {
        const resStatus = res.data?.status;
        if (resStatus === "verified") {
          verificationCache[token] = "verified";
          setStatus("success");
        } else if (resStatus === "already_verified") {
          setStatus("already");
        } else if (resStatus === "expired") {
          setStatus("expired");
        } else {
          setStatus("invalid");
        }
      })
      .catch((err) => {
        const resStatus = err.response?.data?.status;
        if (resStatus === "expired") {
          setStatus("expired");
        } else {
          setStatus("invalid");
        }
      });
  }, [params]);

  const handleResendEmail = async () => {
    if (!resendEmail || !resendEmail.includes("@")) {
      setResendMsg("Please enter a valid email address.");
      return;
    }
    setResending(true);
    setResendMsg("");
    try {
      await resendVerification(resendEmail);
      setResendMsg("Verification link sent! Please check your inbox.");
    } catch (err) {
      setResendMsg(err.response?.data?.message || "Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <Link to="/" className="auth-logo">
          <span className="logo-v">V</span>
          <span className="logo-res">RES</span>
          <span className="logo-iq">IQ</span>
        </Link>

        {status === "verifying" && (
          <div className="verify-state-container">
            <div className="verify-loader-spinner" style={{ margin: "2rem auto" }}></div>
            <h1 className="auth-title">Verifying your email</h1>
            <p className="auth-sub">This usually takes a moment.</p>
          </div>
        )}

        {status === "success" && (
          <div className="verify-state-container">
            <div className="verify-icon-wrapper" style={{ margin: "0 auto 1.5rem" }}>
              <svg className="verify-icon text-success" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ width: "48px", height: "48px", color: "var(--accent-dark)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="auth-title">Email verified</h1>
            <p className="auth-sub">Your VRESIQ account is now active. Start building your professional recruiter-grade resume.</p>
            <Link to="/login">
              <button className="auth-btn" style={{ marginTop: "1rem", width: "100%" }}>Sign in to Workspace</button>
            </Link>
          </div>
        )}

        {status === "already" && (
          <div className="verify-state-container">
            <div className="verify-icon-wrapper" style={{ margin: "0 auto 1.5rem" }}>
              <svg className="verify-icon text-info" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ width: "48px", height: "48px", color: "var(--ink)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="auth-title">Already verified</h1>
            <p className="auth-sub">Your email is already verified. Please sign in to access your dashboard.</p>
            <Link to="/login">
              <button className="auth-btn" style={{ marginTop: "1rem", width: "100%" }}>Go to login</button>
            </Link>
          </div>
        )}

        {status === "expired" && (
          <div className="verify-state-container">
            <div className="verify-icon-wrapper" style={{ margin: "0 auto 1.5rem" }}>
              <svg className="verify-icon text-warning" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ width: "48px", height: "48px", color: "#d97706" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h1 className="auth-title">Link expired</h1>
            <p className="auth-sub">This verification link has expired. Enter your email below to request a new verification link.</p>
            <div className="resend-input-group" style={{ maxWidth: "340px", margin: "1.5rem auto 0" }}>
              <input
                type="email"
                className="resend-email-input"
                placeholder="Enter your email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--line)",
                  marginBottom: "0.75rem",
                  background: "var(--wash)",
                  color: "var(--ink)",
                  outline: "none"
                }}
              />
              <button
                type="button"
                className="auth-btn"
                onClick={handleResendEmail}
                disabled={resending}
                style={{ width: "100%" }}
              >
                {resending ? "Sending..." : "Resend Verification Link"}
              </button>
            </div>
            {resendMsg && (
              <p className={`resend-msg ${resendMsg.includes("sent") || resendMsg.includes("Verification") ? "text-success" : "text-error"}`} style={{ marginTop: "1rem", fontSize: "0.88rem", fontWeight: "600" }}>
                {resendMsg}
              </p>
            )}
          </div>
        )}

        {status === "invalid" && (
          <div className="verify-state-container">
            <div className="verify-icon-wrapper" style={{ margin: "0 auto 1.5rem" }}>
              <svg className="verify-icon text-error" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ width: "48px", height: "48px", color: "var(--danger)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="auth-title">Invalid link</h1>
            <p className="auth-sub">This email verification link is invalid. Please verify you copied the link correctly or request a new one.</p>
            <Link to="/login">
              <button className="auth-btn" style={{ marginTop: "1rem", width: "100%" }}>Back to login</button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
