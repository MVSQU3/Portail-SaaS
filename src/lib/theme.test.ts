import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import {
  THEME_OPTIONS,
  THEME_STORAGE_KEY,
  parseStoredTheme,
  readThemeCookie,
  resolveTheme,
  themeCookie,
  themeInitScript,
} from "./theme";

function runInitScript(options: { local: string | null; cookie: string; prefersDark: boolean }) {
  const root = {
    dark: false,
    style: { colorScheme: "" },
    classList: {
      toggle(_name: string, on: boolean) {
        root.dark = on;
      },
    },
  };
  runInNewContext(themeInitScript(), {
    localStorage: { getItem: () => options.local },
    document: { cookie: options.cookie, documentElement: root },
    window: { matchMedia: () => ({ matches: options.prefersDark }) },
  });
  return root;
}

describe("resolveTheme", () => {
  it("suit le schéma système sans préférence enregistrée", () => {
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme(undefined, false)).toBe("light");
    expect(resolveTheme("autre", true)).toBe("dark");
  });

  it("laisse le choix manuel primer sur le système", () => {
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("light", true)).toBe("light");
  });
});

describe("persistance", () => {
  it("lit le cookie de thème et ignore les autres valeurs", () => {
    expect(parseStoredTheme("dark")).toBe("dark");
    expect(parseStoredTheme("light")).toBe("light");
    expect(parseStoredTheme("system")).toBeNull();
    expect(readThemeCookie(`a=1; ${THEME_STORAGE_KEY}=dark`)).toBe("dark");
    expect(readThemeCookie(`${THEME_STORAGE_KEY}=light; session=abc`)).toBe("light");
    expect(readThemeCookie("fleetcare-theme=bleu")).toBeNull();
  });

  it("écrit un cookie lisible pendant un an", () => {
    expect(themeCookie("dark")).toBe(
      `${THEME_STORAGE_KEY}=dark; Path=/; Max-Age=31536000; SameSite=Lax`,
    );
    expect(themeCookie("light", true)).toContain("Secure");
  });
});

describe("script d’initialisation", () => {
  it("applique la classe dark avant le rendu selon le stockage ou le système", () => {
    const script = themeInitScript();
    expect(script).toContain(THEME_STORAGE_KEY);
    expect(script).toContain("prefers-color-scheme: dark");
    expect(script).toContain('classList.toggle("dark"');
    expect(script).not.toContain("</");
    expect(runInitScript({ local: null, cookie: "", prefersDark: true }).dark).toBe(true);
    expect(runInitScript({ local: "light", cookie: "fleetcare-theme=dark", prefersDark: true })).toMatchObject({
      dark: false,
      style: { colorScheme: "light" },
    });
    expect(runInitScript({ local: null, cookie: "fleetcare-theme=dark", prefersDark: false }).dark).toBe(true);
    expect(runInitScript({ local: null, cookie: "", prefersDark: false }).dark).toBe(false);
  });
});

describe("libellés", () => {
  it("propose Clair puis Sombre", () => {
    expect(THEME_OPTIONS.map((option) => option.label)).toEqual(["Clair", "Sombre"]);
  });
});
