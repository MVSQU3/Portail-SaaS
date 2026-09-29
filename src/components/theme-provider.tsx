"use client";

import { createContext, useContext, useLayoutEffect, useState } from "react";
import {
  THEME_STORAGE_KEY,
  parseStoredTheme,
  readThemeCookie,
  resolveTheme,
  themeCookie,
  type ThemeChoice,
} from "@/lib/theme";

type ThemeContextValue = {
  theme: ThemeChoice;
  setTheme: (theme: ThemeChoice) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readClientTheme(): ThemeChoice | null {
  try {
    const stored = parseStoredTheme(localStorage.getItem(THEME_STORAGE_KEY));
    if (stored) return stored;
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

export function ThemeProvider({
  initialTheme,
  children,
}: {
  initialTheme: ThemeChoice | null;
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<ThemeChoice>(initialTheme ?? "light");

  useLayoutEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyFromSystem = () => {
      const stored = readClientTheme();
      const resolved = resolveTheme(stored, media.matches);
      applyThemeClass(resolved);
      setThemeState(resolved);
    };
    applyFromSystem();
    const onChange = () => {
      if (readClientTheme()) return;
      applyFromSystem();
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const setTheme = (next: ThemeChoice) => {
    persistTheme(next);
    setThemeState(next);
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("Le sélecteur de thème doit être affiché dans l’application.");
  }
  return value;
}
