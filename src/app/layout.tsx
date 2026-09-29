import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ThemeProvider } from "@/components/theme-provider";
import { THEME_STORAGE_KEY, parseStoredTheme, themeInitScript } from "@/lib/theme";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "FleetCare",
    template: "%s · FleetCare",
  },
  description: "Suivi de flotte, relevés et alertes pour les entreprises.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const initialTheme = parseStoredTheme(jar.get(THEME_STORAGE_KEY)?.value);

  return (
    <html
      lang="fr"
      className={initialTheme === "dark" ? "dark" : undefined}
      style={initialTheme ? { colorScheme: initialTheme } : undefined}
      suppressHydrationWarning
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript() }} />
        <ThemeProvider initialTheme={initialTheme}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
