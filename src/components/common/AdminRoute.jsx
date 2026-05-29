import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex",
        alignItems: "center", justifyContent: "center"
      }}>
        <div className="spinner" />
      </div>
    );
  }

  return user && user.role === "ADMIN" ? children : <Navigate to="/dashboard" replace />;
};

export default AdminRoute;
