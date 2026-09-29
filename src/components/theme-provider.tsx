"use client";

import { createContext, useContext, useLayoutEffect, useState } from "react";
import {
  THEME_STORAGE_KEY,
  clearThemeCookie,
  parseStoredTheme,
  readThemeCookie,
  resolveTheme,
  themeCookie,
  type ThemeChoice,
  type ThemePreference,
} from "@/lib/theme";

type ThemeContextValue = {
  preference: ThemePreference;
  setTheme: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readClientTheme(): ThemeChoice | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "system") return null;
    const parsed = parseStoredTheme(stored);
    if (parsed) return parsed;
  } catch {
    /* private mode */
  }
  return readThemeCookie(document.cookie);
}

function applyThemeClass(theme: ThemeChoice) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

function persistTheme(theme: ThemeChoice) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* private mode */
  }
  document.cookie = themeCookie(theme, window.location.protocol === "https:");
  applyThemeClass(theme);
}

function clearStoredTheme() {
  try {
    localStorage.removeItem(THEME_STORAGE_KEY);
  } catch {
    /* private mode */
  }
  document.cookie = clearThemeCookie(false);
  document.cookie = clearThemeCookie(true);
}

export function ThemeProvider({
  initialTheme,
  children,
}: {
  initialTheme: ThemeChoice | null;
  children: React.ReactNode;
}) {
  const [preference, setPreference] = useState<ThemePreference>(initialTheme ?? "system");

  useLayoutEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyFromStorage = () => {
      const stored = readClientTheme();
      applyThemeClass(resolveTheme(stored, media.matches));
      setPreference(stored ?? "system");
    };
    applyFromStorage();
    const onChange = () => {
      if (readClientTheme()) return;
      applyThemeClass(resolveTheme(null, media.matches));
      setPreference("system");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const setTheme = (next: ThemePreference) => {
    if (next === "system") {
      clearStoredTheme();
      applyThemeClass(resolveTheme(null, window.matchMedia("(prefers-color-scheme: dark)").matches));
    } else {
      persistTheme(next);
    }
    setPreference(next);
  };

  return <ThemeContext.Provider value={{ preference, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("Le sélecteur de thème doit être affiché dans l’application.");
  }
  return value;
}
