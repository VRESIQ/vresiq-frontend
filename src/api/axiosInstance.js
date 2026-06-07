import axios from "axios";
import { loadingService } from "../utils/loadingService";

/*
Purpose: Configures Axios instance, attaches authorization headers, manages loading indicator transitions, and handles session expiration intercepts.
Used By: api/index.js
Request Flow: React Components -> Axios Instance Interceptors -> Target Backend Server
Data Flow: HTTP Requests / Responses -> Interceptor middleware -> JWT header injection
Learn: Axios interceptors, JWT auto-attach middleware, HTTP status codes intercepting
*/
const resolveBaseUrl = () => {
  const raw = (import.meta.env.VITE_API_BASE_URL || "").trim();

  // Prefer same-origin in browser by default so Vite proxy (dev)
  // and same-host deployments (prod) work without extra env setup.
  if (!raw) return "";

  // If env value is clearly malformed, ignore it instead of hard-failing all API calls.
  try {
    // Accept absolute URLs only (http/https). Relative values fall back to same-origin.
    const url = new URL(raw);
    if (url.protocol === "http:" || url.protocol === "https:") return raw;
    return "";
  } catch {
    return "";
  }
};

const axiosInstance = axios.create({
  baseURL: resolveBaseUrl(),
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token on every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (!config.skipLoader) {
      loadingService.start(config.url, config.method);
    }
    return config;
  },
  (error) => {
    if (!error.config?.skipLoader) {
      loadingService.stop(error.config?.url, error.config?.method);
    }
    return Promise.reject(error);
  }
);

let isLoggingOut = false;

// Handle errors: on 401 clear stale token and redirect to login
axiosInstance.interceptors.response.use(
  (res) => {
    if (!res.config?.skipLoader) {
      loadingService.stop(res.config?.url, res.config?.method);
    }
    return res;
  },
  (error) => {
    if (!error.config?.skipLoader) {
      loadingService.stop(error.config?.url, error.config?.method);
    }
    const isUnauthorized = error.response?.status === 401;

    if (isUnauthorized) {
      if (!isLoggingOut) {
        isLoggingOut = true;
        localStorage.removeItem("token");
        sessionStorage.removeItem("tabToken");
        
        // Redirect cleanly to login page with expired flag
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login?expired=1";
        }
        
        // Reset flag after a delay to ensure future valid logins can proceed
        setTimeout(() => {
          isLoggingOut = false;
        }, 3000);
      }
    } else {
      console.error("API ERROR:", error.response?.status, error.response?.data || error.message);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

