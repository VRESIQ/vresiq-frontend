import { useEffect } from "react";

/**
 * useTheme — initializes theme from localStorage or system preference.
 * Call once at the app root. Does NOT need to return anything;
 * ThemeToggle reads/writes document.documentElement directly.
 */
export function useTheme() {
  useEffect(() => {
    const saved = localStorage.getItem("vresiq-theme");
    const system = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", saved || system);
  }, []);
}
