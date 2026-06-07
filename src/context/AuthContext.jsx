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

  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const tabToken = sessionStorage.getItem("tabToken");

    if (token !== tabToken) {
      if (!token) {
        setNotification({
          message: "Your session changed in another tab.",
          subtext: "Reloading to keep your account data consistent.",
          action: () => {
            sessionStorage.removeItem("tabToken");
            setUser(null);
            if (!window.location.pathname.startsWith("/login")) {
              window.location.href = "/login?expired=1";
            } else {
              window.location.reload();
            }
          }
        });
      } else {
        setNotification({
          message: "You signed into a different account.",
          subtext: "Reloading to keep your account data consistent.",
          action: () => {
            sessionStorage.setItem("tabToken", token);
            window.location.reload();
          }
        });
      }
      setLoading(false);
      return;
    }

    if (token) {
      getProfile()
        .then((res) => {
          setUser(res.data);
          sessionStorage.setItem("tabToken", token);
        })
        .catch((err) => {
          console.error("Profile fetch failed:", err);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "token") {
        const newToken = e.newValue;
        const oldToken = e.oldValue;

        if (newToken === oldToken) return;

        if (!newToken) {
          setNotification({
            message: "Your session changed in another tab.",
            subtext: "Reloading to keep your account data consistent.",
            action: () => {
              sessionStorage.removeItem("tabToken");
              setUser(null);
              if (!window.location.pathname.startsWith("/login")) {
                window.location.href = "/login?expired=1";
              } else {
                window.location.reload();
              }
            }
          });
        } else {
          setNotification({
            message: "You signed into a different account.",
            subtext: "Reloading to keep your account data consistent.",
            action: () => {
              sessionStorage.setItem("tabToken", newToken || "");
              window.location.reload();
            }
          });
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        notification.action();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const loginUser = (userData) => {
    localStorage.setItem("token", userData.token);
    sessionStorage.setItem("tabToken", userData.token);
    setUser(userData);
  };

  const logoutUser = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("tabToken");
    setUser(null);
  };

  const updateUser = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
  };

  const overlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(10, 11, 9, 0.7)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999999,
  };

  const modalStyle = {
    background: "var(--paper)",
    border: "1px solid var(--line)",
    borderRadius: "16px",
    padding: "32px 24px",
    maxWidth: "400px",
    width: "90%",
    textAlign: "center",
    boxShadow: "var(--shadow)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    color: "var(--ink)",
    gap: "12px",
  };

  const iconStyle = {
    fontSize: "36px",
    marginBottom: "8px",
    animation: "spin 2s linear infinite",
  };

  const titleStyle = {
    fontSize: "20px",
    fontWeight: "700",
    margin: 0,
    fontFamily: "Inter, sans-serif",
  };

  const subtextStyle = {
    fontSize: "14px",
    color: "var(--muted)",
    margin: "0 0 16px 0",
    lineHeight: "1.5",
    fontFamily: "Inter, sans-serif",
  };

  const spinnerStyle = {
    width: "24px",
    height: "24px",
    border: "3px solid var(--line)",
    borderTop: "3px solid var(--accent-dark)",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, loginUser, logoutUser, updateUser }}
    >
      {notification && (
        <div style={overlayStyle}>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1); }
            }
          `}</style>
          <div style={{ ...modalStyle, animation: "fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)" }}>
            <div style={iconStyle}>🔄</div>
            <h3 style={titleStyle}>{notification.message}</h3>
            <p style={subtextStyle}>{notification.subtext}</p>
            <div style={spinnerStyle}></div>
          </div>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);