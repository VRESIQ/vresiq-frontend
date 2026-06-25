import { useState } from "react";

const SocialAuth = ({ onError }) => {
  const [loading, setLoading] = useState(false);

  const handleSocialLogin = (providerName) => {
    setLoading(true);
    onError("");
    const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").trim();
    window.location.href = `${apiBaseUrl}/oauth2/authorization/${providerName}`;
  };

  return (
    <div>
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

        <div className="social-divider">or</div>
      </div>
    </div>
  );
};

export default SocialAuth;
