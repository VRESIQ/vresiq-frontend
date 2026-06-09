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
    const token = sessionStorage.getItem("token");
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

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Handle errors: on 401 clear stale token and redirect to login
axiosInstance.interceptors.response.use(
  (res) => {
    if (!res.config?.skipLoader) {
      loadingService.stop(res.config?.url, res.config?.method);
    }
    return res;
  },
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest?.skipLoader) {
      loadingService.stop(originalRequest?.url, originalRequest?.method);
    }
    
    const isUnauthorized = error.response?.status === 401;

    // Prevent recursive loop if the refresh call itself fails with 401
    if (isUnauthorized && originalRequest.url.includes("/api/auth/refresh")) {
      sessionStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login?expired=1";
      }
      return Promise.reject(error);
    }

    if (isUnauthorized && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        sessionStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login?expired=1";
        }
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          (originalRequest.baseURL || "") + "/api/auth/refresh",
          { refreshToken },
          { headers: { "Content-Type": "application/json" } }
        );

        const { token: newAccessToken, refreshToken: newRefreshToken } = response.data;
        sessionStorage.setItem("token", newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        isRefreshing = false;

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        sessionStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login?expired=1";
        }
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }

    if (!isUnauthorized) {
      console.error("API ERROR:", error.response?.status, error.response?.data || error.message);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

