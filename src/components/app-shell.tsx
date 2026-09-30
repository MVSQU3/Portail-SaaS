"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOutAction } from "@/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { isActivePath, type NavItem } from "@/lib/navigation";

export function AppShell({
  section,
  contextLabel,
  items,
  children,
}: {
  section: string;
  contextLabel: string;
  items: readonly NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <span className="text-sm font-semibold tracking-tight">FleetCare</span>
        <button
          type="button"
          className="btn-secondary px-3 py-1.5"
          aria-expanded={open}
          aria-controls="navigation-principale"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Fermer" : "Menu"}
        </button>
      </div>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          aria-label="Fermer le menu"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <aside
        id="navigation-principale"
        className={`${open ? "flex" : "hidden"} fixed inset-y-0 left-0 z-40 w-64 flex-col border-r border-slate-200 bg-white lg:static lg:flex lg:w-auto`}
      >
        <div className="border-b border-slate-200 px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-800">FleetCare</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{section}</p>
          <p className="mt-1 truncate text-sm text-slate-500">{contextLabel}</p>
        </div>
        <nav className="flex-1 px-3 py-4" aria-label={section}>
          <ul className="grid gap-1">
            {items.map((item) =>
              item.kind === "sign-out" ? (
                <li key={item.label} className="mt-3 border-t border-slate-200 pt-3">
                  <form action={signOutAction}>
                    <button
                      type="submit"
                      className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      {item.label}
                    </button>
                  </form>
                </li>
              ) : (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
                    className={`block rounded-md px-3 py-2 text-sm ${
                      isActivePath(pathname, item.href)
                        ? "bg-teal-50 font-semibold text-teal-900"
                        : "font-medium text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>
        <div className="mt-auto border-t border-slate-200 px-3 py-3">
          <ThemeToggle />
        </div>
      </aside>
      <div className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-6xl gap-6">{children}</div>
      </div>
    </div>
  );
}
