import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PhoneNumberInput from "./PhoneNumberInput";
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
                <label>Phone Number</label>
                <PhoneNumberInput 
                  value={phoneNumber} 
                  onChange={setPhoneNumber} 
                  placeholder="Enter phone number" 
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
