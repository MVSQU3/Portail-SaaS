"use client";

import { THEME_OPTIONS } from "@/lib/theme";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { preference, setTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label="Thème"
      className={`theme-toggle grid grid-cols-3 gap-1 rounded-md border p-1 ${className}`}
    >
      {THEME_OPTIONS.map((option) => {
        const selected = preference === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            className={`rounded-md px-1 py-1.5 text-xs ${
              selected
                ? "bg-teal-50 font-semibold text-teal-900"
                : "font-medium text-slate-700 hover:bg-slate-100"
            }`}
            onClick={() => setTheme(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
