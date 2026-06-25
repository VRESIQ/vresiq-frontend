import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  googleLogin, 
  microsoftLogin, 
  appleLogin, 
  verifyPhoneOtp 
} from "../api";
import { 
  auth, 
  googleProvider, 
  microsoftProvider, 
  appleProvider, 
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "../utils/firebase";

const SocialAuth = ({ onError }) => {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [phoneMode, setPhoneMode] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);

  const handleSocialLogin = (providerName) => {
    setLoading(true);
    onError("");
    const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").trim();
    window.location.href = `${apiBaseUrl}/oauth2/authorization/${providerName}`;
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    onError("");
    setLoading(true);

    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible"
        });
      }
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
    } catch (err) {
      console.error(err);
      onError(err.message || "Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    onError("");
    setLoading(true);

    try {
      const result = await confirmationResult.confirm(verificationCode);
      const token = await result.user.getIdToken();
      const res = await verifyPhoneOtp(token, phoneNumber);
      loginUser(res.data);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      onError(err.response?.data?.message || err.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div id="recaptcha-container"></div>

      {!phoneMode ? (
        <div className="social-buttons">
          <button 
            type="button" 
            className="social-btn" 
            onClick={() => handleSocialLogin("google")}
            disabled={loading}
          >
            <svg className="social-icon" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.488 0-6.319-2.83-6.319-6.318 0-3.489 2.83-6.319 6.32-6.319 1.572 0 2.97.581 4.05 1.528l3.056-3.056C19.062 2.302 15.86 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c5.897 0 10.867-4.225 10.867-11.24 0-.768-.068-1.514-.227-2.24H12.24v.025z"/>
            </svg>
            Continue with Google
          </button>

          <button 
            type="button" 
            className="social-btn" 
            onClick={() => handleSocialLogin("microsoft")}
            disabled={loading}
          >
            <svg className="social-icon" viewBox="0 0 23 23">
              <path fill="#f35325" d="M0 0h11v11H0z"/>
              <path fill="#81bc06" d="M12 0h11v11H12z"/>
              <path fill="#05a6f0" d="M0 12h11v11H0z"/>
              <path fill="#ffba08" d="M12 12h11v11H12z"/>
            </svg>
            Continue with Microsoft
          </button>

          <button 
            type="button" 
            className="social-btn" 
            onClick={() => handleSocialLogin("apple")}
            disabled={loading}
          >
            <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.64.74-1.2 1.88-1.05 2.99 1.12.09 2.26-.55 3-1.43z"/>
            </svg>
            Continue with Apple
          </button>

          <button 
            type="button" 
            className="social-btn" 
            onClick={() => setPhoneMode(true)}
            disabled={loading}
          >
            <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1.02 1.02 0 00-1.02.24l-2.2 2.2a15.1 15.1 0 01-6.59-6.59l2.2-2.2a1 1 0 00.25-1.02A11.4 11.4 0 018.5 4c0-.56-.44-1-1-1H4c-.56 0-1 .44-1 1 0 9.39 7.61 17 17 17 .56 0 1-.44 1-1v-3.5c0-.56-.44-1-1-1z"/>
            </svg>
            Continue with Phone Number
          </button>

          <div className="social-divider">or</div>
        </div>
      ) : (
        <div style={{ marginBottom: "1.5rem" }}>
          {!confirmationResult ? (
            <form onSubmit={handlePhoneSubmit}>
              <div className="field" style={{ marginBottom: "0.75rem" }}>
                <label>Phone Number (with Country Code)</label>
                <input 
                  type="tel" 
                  value={phoneNumber} 
                  onChange={(e) => setPhoneNumber(e.target.value)} 
                  placeholder="+1 555 555 5555" 
                  required
                />
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button type="submit" className="auth-btn" style={{ flex: 1, marginTop: 0 }} disabled={loading}>
                  {loading ? "Sending..." : "Send Verification Code"}
                </button>
                <button type="button" className="auth-btn" style={{ background: "transparent", border: "1px solid var(--line)", color: "var(--ink)", marginTop: 0 }} onClick={() => setPhoneMode(false)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCodeSubmit}>
              <div className="field" style={{ marginBottom: "0.75rem" }}>
                <label>Enter Verification Code</label>
                <input 
                  type="text" 
                  value={verificationCode} 
                  onChange={(e) => setVerificationCode(e.target.value)} 
                  placeholder="123456" 
                  required
                />
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button type="submit" className="auth-btn" style={{ flex: 1, marginTop: 0 }} disabled={loading}>
                  {loading ? "Verifying..." : "Verify Code"}
                </button>
                <button type="button" className="auth-btn" style={{ background: "transparent", border: "1px solid var(--line)", color: "var(--ink)", marginTop: 0 }} onClick={() => setConfirmationResult(null)}>
                  Resend
                </button>
              </div>
            </form>
          )}
          <div className="social-divider">or</div>
        </div>
      )}
    </div>
  );
};

export default SocialAuth;
