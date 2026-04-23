import { useState, useEffect } from "react";

const THEME_KEY = "aristotelian-theme";

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem(THEME_KEY) || "light"; } catch { return "light"; }
  });

  useEffect(() => {
    document.body.className = "theme-" + theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      "content", theme === "dark" ? "#0E0A06" : "#F4EDE4"
    );
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");
  return [theme, toggleTheme];
}
