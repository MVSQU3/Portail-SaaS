export const THEME_STORAGE_KEY = "fleetcare-theme";

export const THEME_OPTIONS = [
  { value: "light", label: "Clair" },
  { value: "dark", label: "Sombre" },
] as const;

export type ThemeChoice = (typeof THEME_OPTIONS)[number]["value"];

export function parseStoredTheme(value: string | null | undefined): ThemeChoice | null {
  if (value === "light" || value === "dark") return value;
  return null;
}

export function resolveTheme(stored: string | null | undefined, prefersDark: boolean): ThemeChoice {
  const choice = parseStoredTheme(stored);
  if (choice) return choice;
  return prefersDark ? "dark" : "light";
}

export function themeCookie(theme: ThemeChoice, secure = false): string {
  const base = `${THEME_STORAGE_KEY}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
  return secure ? `${base}; Secure` : base;
}

export function readThemeCookie(cookieHeader: string): ThemeChoice | null {
  const match = cookieHeader.match(new RegExp(`(?:^|; )${THEME_STORAGE_KEY}=(light|dark)(?=;|$)`));
  return parseStoredTheme(match?.[1]);
}

export function themeInitScript(): string {
  const key = JSON.stringify(THEME_STORAGE_KEY);
  return `(function(){try{var k=${key};var s=null;try{s=localStorage.getItem(k);}catch(e){}if(s!=="light"&&s!=="dark"){var m=document.cookie.match(/(?:^|; )${THEME_STORAGE_KEY}=(light|dark)(?=;|$)/);s=m?m[1]:null;}var dark=s==="dark"||(s!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var root=document.documentElement;root.classList.toggle("dark",dark);root.style.colorScheme=dark?"dark":"light";}catch(e){}})();`;
}
