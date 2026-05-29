import { useState, useEffect } from "react";
import "./ThemeToggle.css";

/**
 * ThemeToggle — sun/moon button that switches between light and dark mode.
 *
 * HOW IT WORKS:
 * - Sets `data-theme="dark"` or `data-theme="light"` on <html>
 * - CSS variables in brand.css react to [data-theme="dark"] selector
 * - Choice is saved to localStorage so it persists across sessions
 */
const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(false);

  // Read current theme on mount
  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setIsDark(current === "dark");
  }, []);

  const toggle = () => {
    const next = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("vresiq-theme", next);
    setIsDark(!isDark);
  };

  return (
    <button
      id="theme-toggle"
      className="theme-toggle"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      )}
    </button>
  );
};

export default ThemeToggle;
