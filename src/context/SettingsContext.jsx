import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { loadSettings, saveSettings } from "../storage.js";
import { DEFAULT_SETTINGS } from "../constants.js";

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => loadSettings());

  useEffect(() => {
    const onChange = (e) => setSettings(e.detail);
    window.addEventListener("settingschange", onChange);
    return () => window.removeEventListener("settingschange", onChange);
  }, []);

  const updateSettings = useCallback((partial) => {
    const next = saveSettings(partial);
    setSettings(next);
    return next;
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, defaults: DEFAULT_SETTINGS }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside <SettingsProvider>");
  return ctx;
}
