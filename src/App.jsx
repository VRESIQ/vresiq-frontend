import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/common/PrivateRoute";
import ErrorBoundary from "./components/common/ErrorBoundary";
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

// Lazy load heavy pages
import { lazy, Suspense } from "react";
import AdminRoute from "./components/common/AdminRoute";
import GlobalLoader from "./components/common/GlobalLoader";
const ResumeEditor = lazy(() => import("./pages/ResumeEditor"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
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
  return (
    <BrowserRouter>
      <AuthProvider>
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

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
