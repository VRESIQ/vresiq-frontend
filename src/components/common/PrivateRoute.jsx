import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import MediumLoader from "./MediumLoader";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <MediumLoader statusText="Restoring session..." />;
  }

  return user ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
