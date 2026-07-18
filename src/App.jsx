import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import * as Sentry from "@sentry/react";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/common/PrivateRoute";
import ErrorBoundary from "./components/common/ErrorBoundary";
import PageViewTracker from "./components/common/PageViewTracker";
import SentryFallback from "./components/common/SentryFallback";
import { useTheme } from "./hooks/useTheme";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Dashboard from "./pages/Dashboard";
import Pricing from "./pages/Pricing";
import Profile from "./pages/Profile";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Suspended from "./pages/Suspended";

// Lazy load heavy pages
import { lazy, Suspense, useEffect } from "react";
import AdminRoute from "./components/common/AdminRoute";
import GlobalLoader from "./components/common/GlobalLoader";

// Dynamic import with recovery retry for CSS / module preloads
const lazyWithRetry = (importFn) => {
  return lazy(() => {
    return importFn().catch((error) => {
      const msg = error.message || "";
      if (
        msg.includes("Unable to preload CSS") || 
        msg.includes("Failed to fetch dynamically imported module") ||
        msg.includes("preload")
      ) {
        const hasReloaded = sessionStorage.getItem("chunk-load-reloaded");
        if (!hasReloaded) {
          sessionStorage.setItem("chunk-load-reloaded", "true");
          
          const toast = document.createElement("div");
          toast.style.position = "fixed";
          toast.style.bottom = "24px";
          toast.style.right = "24px";
          toast.style.backgroundColor = "#ba2b2b";
          toast.style.color = "#ffffff";
          toast.style.padding = "14px 28px";
          toast.style.borderRadius = "8px";
          toast.style.boxShadow = "0 8px 24px rgba(0,0,0,0.25)";
          toast.style.zIndex = "999999";
          toast.style.fontFamily = "system-ui, -apple-system, sans-serif";
          toast.style.fontSize = "0.92rem";
          toast.style.fontWeight = "600";
          toast.style.border = "1px solid rgba(255,255,255,0.1)";
          toast.innerText = "A new version of the application is available. Refreshing...";
          document.body.appendChild(toast);
          
          setTimeout(() => {
            window.location.reload();
          }, 1500);
          
          return new Promise(() => {}); // Wait here until reload
        }
      }
      throw error;
    });
  });
};

const ResumeEditor = lazyWithRetry(() => import("./pages/ResumeEditor"));
const AdminDashboard = lazyWithRetry(() => import("./pages/AdminDashboard"));
const ResumeReconstructionStudio = lazyWithRetry(() => import("./pages/ResumeReconstructionStudio"));

// Register global error listeners for Vite CSS preload errors
const handlePreloadFailure = (msg) => {
  if (
    msg.includes("Unable to preload CSS") || 
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("preload")
  ) {
    const hasReloaded = sessionStorage.getItem("chunk-load-reloaded");
    if (!hasReloaded) {
      sessionStorage.setItem("chunk-load-reloaded", "true");
      
      const toast = document.createElement("div");
      toast.style.position = "fixed";
      toast.style.bottom = "24px";
      toast.style.right = "24px";
      toast.style.backgroundColor = "#ba2b2b";
      toast.style.color = "#ffffff";
      toast.style.padding = "14px 28px";
      toast.style.borderRadius = "8px";
      toast.style.boxShadow = "0 8px 24px rgba(0,0,0,0.25)";
      toast.style.zIndex = "999999";
      toast.style.fontFamily = "system-ui, -apple-system, sans-serif";
      toast.style.fontSize = "0.92rem";
      toast.style.fontWeight = "600";
      toast.style.border = "1px solid rgba(255,255,255,0.1)";
      toast.innerText = "A new version of the application is available. Refreshing...";
      document.body.appendChild(toast);
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  }
};

window.addEventListener("error", (e) => {
  handlePreloadFailure(e.message || "");
});

window.addEventListener("unhandledrejection", (e) => {
  const reason = e.reason;
  handlePreloadFailure(reason?.message || (typeof reason === "string" ? reason : ""));
});

import "./styles/brand.css";

const SuspenseFallback = () => (
  <div className="app-loading">
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <div className="nav-logo" style={{ fontSize: '1.8rem', pointerEvents: 'none', textDecoration: 'none' }}>
        <span className="logo-v">V</span>
        <span className="logo-res">RES</span>
        <span className="logo-iq">IQ</span>
      </div>
      <div className="spinner" />
    </div>
  </div>
);

function App() {
  useTheme(); // reads localStorage / OS preference, sets data-theme on <html>
  
  useEffect(() => {
    // Clear chunk-load-reloaded flag on successful mount
    sessionStorage.removeItem("chunk-load-reloaded");
  }, []);

  return (
    <BrowserRouter>
      <Sentry.ErrorBoundary fallback={({ error, resetError }) => (
        <SentryFallback error={error} resetError={resetError} />
      )}>
        <AuthProvider>
          <PageViewTracker />
          <GlobalLoader />
          <Suspense fallback={<SuspenseFallback />}>
            <Routes>

            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/suspended" element={<Suspended />} />

            {/* Protected */}
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route
              path="/resume/:id/edit"
              element={
                <PrivateRoute>
                  <ErrorBoundary>
                    <ResumeEditor />
                  </ErrorBoundary>
                </PrivateRoute>
              }
            />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route
              path="/admin"
              element={
                <PrivateRoute>
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/reconstruct"
              element={
                <PrivateRoute>
                  <AdminRoute>
                    <ResumeReconstructionStudio />
                  </AdminRoute>
                </PrivateRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </Sentry.ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
