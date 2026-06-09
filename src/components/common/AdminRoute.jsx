import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import MediumLoader from "./MediumLoader";

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <MediumLoader statusText="Verifying credentials..." />;
  }

  return user && user.role === "ADMIN" ? children : <Navigate to="/dashboard" replace />;
};

export default AdminRoute;
