import { createContext, useContext, useState, useEffect } from "react";
import { getProfile } from "../api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      getProfile()
        .then((res) => {
          setUser(res.data);
        })
        .catch((err) => {
          console.error("Profile fetch failed:", err);
          // ❌ token remove cheyyaku immediately
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const loginUser = (userData) => {
    localStorage.setItem("token", userData.token);
    setUser(userData);
  };

  const logoutUser = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const updateUser = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, loginUser, logoutUser, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);