import { createContext, useContext, useState, useEffect } from "react";
import { getProfile } from "../api";

const AuthContext = createContext(null);

/*
Purpose: Manages global React user authentication states, login/logout actions, and token storage.
Used By: Profile.jsx, Dashboard.jsx, PrivateRoute.jsx
Request Flow: React Components -> useAuth context -> API methods -> Storage updates
Data Flow: API login token -> AuthProvider state -> LocalStorage / React Context consumers
Learn: createContext, useContext hook, Global React session management
*/
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