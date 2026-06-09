import { createContext, useContext, useState, useEffect } from "react";
import { getProfile, refresh } from "../api";

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

  const logoutUser = () => {
    sessionStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setUser(null);
  };

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const refreshToken = localStorage.getItem("refreshToken");

    if (token) {
      getProfile()
        .then((res) => {
          setUser(res.data);
        })
        .catch((err) => {
          console.error("Profile fetch failed:", err);
          logoutUser();
        })
        .finally(() => setLoading(false));
    } else if (refreshToken) {
      refresh(refreshToken)
        .then((res) => {
          const { token: newAccessToken, refreshToken: newRefreshToken } = res.data;
          sessionStorage.setItem("token", newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem("refreshToken", newRefreshToken);
          }
          return getProfile();
        })
        .then((profileRes) => {
          setUser(profileRes.data);
        })
        .catch((err) => {
          console.error("Silent refresh failed on startup:", err);
          logoutUser();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const loginUser = (userData) => {
    sessionStorage.setItem("token", userData.token);
    if (userData.refreshToken) {
      localStorage.setItem("refreshToken", userData.refreshToken);
    }
    setUser(userData);
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