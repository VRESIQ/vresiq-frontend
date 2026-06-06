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
const ResumeEditor = lazy(() => import("./pages/ResumeEditor"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
import "./styles/brand.css";

function App() {
  useTheme(); // reads localStorage / OS preference, sets data-theme on <html>
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<div className="app-loading">Loading…</div>}>
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
